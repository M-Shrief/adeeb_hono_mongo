// /////
import { logger } from '../../../utils/logger.js';
import { Claims } from "../../../schemas/jwt.js";
import { new_claims, sign_jwt, verify_jwt } from "../../../auth//jwt.js"
import { AuthError, AuthError_ReasonEnum } from '../../../auth/errors.js';
import { verify_admin_user } from '../../../auth/utils.js';
import {repository} from "./repository.js"
import { APIError } from '../../../utils/errors.js';
import { HttpStatusCode } from '../../../utils/api.js';


const new_tokens = async (user: Claims["user"], family_id?: string) => {
    try {
        const {access_model, refresh_model} = await repository.new_tokens(user, family_id)
        let access_claims = await new_claims(
            {
                jti: access_model.jti, 
                family_id: access_model.family_id, 
                token_type: access_model.token_type, 
                exp: access_model.exp, 
                iat: access_model.iat,
            },
            user
        )
        let refresh_claims = await new_claims(
            {
                jti: refresh_model.jti, 
                family_id: refresh_model.family_id, 
                token_type: refresh_model.token_type, 
                exp: refresh_model.exp, 
                iat: refresh_model.iat,
            },
            user
        )

        let access_token = await sign_jwt(access_claims)
        let refresh_token = await sign_jwt(refresh_claims)
        return {access_token, refresh_token}

    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in JWT's new_tokens()")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const refresh = async (token: string) => {
    try{
        let result = await verify_jwt(token, "refresh") 
        if(result.error) {
            throw new AuthError(AuthError_ReasonEnum.INVALID_TOKEN, "service")
        }
        let token_model = await repository.get_one_by_id(result.claims.jti)
        if (token_model.is_banned) {
            throw new AuthError(AuthError_ReasonEnum.BANNED, "service")
        }
        if (token_model.used) {
            await repository.ban_jwts_with_filters(undefined, token_model.family_id.toString())
            throw new AuthError(AuthError_ReasonEnum.USED, "service")
        }
        await repository.update_one(result.claims.jti, {used: true})
        const {access_model, refresh_model} = await repository.new_tokens(token_model.user, token_model.family_id)
        let access_claims = await new_claims(
            {
                jti: access_model.jti, 
                family_id: access_model.family_id, 
                token_type: access_model.token_type, 
                exp: access_model.exp, 
                iat: access_model.iat,
            },
            token_model.user
        )
        let refresh_claims = await new_claims(
            {
                jti: refresh_model.jti, 
                family_id: refresh_model.family_id, 
                token_type: refresh_model.token_type, 
                exp: refresh_model.exp, 
                iat: refresh_model.iat,
            },
            token_model.user
        )

        let access_token = await sign_jwt(access_claims)
        let refresh_token = await sign_jwt(refresh_claims)
        return {access_token, refresh_token}
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in JWT's refresh()")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const get_all = async(token: string, limit: number, offset: number) => {
    try {
        await verify_admin_user(token)
        let repo_result = await repository.get_all(limit, offset)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /jwts")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_one_by_id = async (id: string, token: string) => {
    try {
        await verify_admin_user(token)
        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /jwts/{id}")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
}

const update_one = async(id: string, token: string, data: any) => {
    try {
        await verify_admin_user(token, "write")        
        let repo_result = await repository.update_one(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /jwts/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const ban_one = async(id: string, token: string) => {
    try {
        await verify_admin_user(token, "write")        
        let repo_result = await repository.update_one(id, {is_banned: true})
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /jwts/:id/ban")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const ban_jwts_with_filters = async(token: string, user_id?: string, family_id?: string) => {
    try {
        await verify_admin_user(token, "write")        
        let repo_result = await repository.ban_jwts_with_filters(user_id, family_id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, `error in banning multiple JWTs with filters, family: ${family_id} & user: ${user_id}`)
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_one = async(id: string, token: string) => {
    try {
        await verify_admin_user(token, "write")
    
        let repo_result = await repository.delete_one(id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const cleanup = async(token: string) => {
    try {
        await verify_admin_user(token, "write")
    
        let repo_result = await repository.cleanup()
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}



export const service = {
    new_tokens,
    refresh,
    get_all,
    get_one_by_id,
    update_one,
    ban_one,
    ban_jwts_with_filters,
    delete_one,
    cleanup,
}