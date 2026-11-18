////
import { HttpStatusCode } from "../../utils/api.js"
import { compare_password} from "../../auth/passwords.js"
import { verify_admin_user, verify_normal_user } from "../../auth/utils.js"
import { APIError } from "../../utils/errors.js"
import { logger } from "../../utils/logger.js"
import { repository } from "./repository.js"
import {service as jwt_service} from "./jwts/service.js"
import { Claims } from "../../schemas/jwt.js"
import { verify_jwt } from "../../auth/jwt.js"
import { AuthError, AuthError_ReasonEnum } from "../../auth/errors.js"
import {repository as jwts_repository} from "./jwts/repository.js"

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
            logger.error({error:e}, "Error in GET /users")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_current_one = async(token: string) => {
    try {
        // even if user is banned, he should be able to read his data.
        // so don't check his permission and we don't use verify_normal_user()
        let result = await verify_jwt(token) 
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let repo_result = await repository.get_one_by_id(result.claims.user!.id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /users/me")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const get_one_by_id = async(id: string, token: string) => {
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
            logger.error({error:e}, "Error in GET /users/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const signup = async(new_data: any) => {
    try {
        let new_user = await repository.signup(new_data)

        let claims_user: Claims["user"] = {id: new_user.get("id").toString(), username: new_user.get("username"), roles: new_user.get("roles")}
        const {access_token, refresh_token} = await jwt_service.new_tokens(claims_user)

        return {
            res_body: {user: {id: new_user.id, username: new_user.username, roles: new_user.roles}, access_token},
            refresh_token
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /users")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const login = async(login_data: any) => {
    try {
        let existing_user = await repository.get_one_for_login(login_data.username)
        let pass_is_correct = await compare_password(login_data.password, existing_user.get("password"))
        if (!pass_is_correct) {
            throw new AuthError(AuthError_ReasonEnum.INVALID_PASS, "service")
        }
        
        let claims_user: Claims["user"] = {id: existing_user.get("id").toString(), username: existing_user.get("username"), roles: existing_user.get("roles")}
        const {access_token, refresh_token} = await jwt_service.new_tokens(claims_user)

        return {
            res_body: {user: {id: existing_user.id, username: existing_user.username, roles: existing_user.roles}, access_token},
            refresh_token
        }
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in querying user by username for login request")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const update_current_user = async(token: string, data: any) => {
    try {
        let claims = await verify_normal_user(token, "write")
        let repo_result = await repository.update_current_user(claims.user!.id, data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/me")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_user_by_id = async(id: string, token: string, data: any) => {
    try {
        await verify_admin_user(token, "write")        
        let repo_result = await repository.update_user_by_id(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const ban_user_by_id = async(id: string, token: string) => {
    try {
        await verify_admin_user(token, "write")        
        await jwts_repository.ban_jwts_with_filters(id)
        let repo_result = await repository.ban_user_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/:id/ban")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_current_user = async(token: string) => {
    try {
        let claims = await verify_normal_user(token, "write")
        await jwts_repository.delete_user_jwts(claims.user!.id)
        let repo_result = await repository.delete_one(claims.user!.id)
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


const delete_one = async(id: string, token: string) => {
    try {
        await verify_admin_user(token, "write")
        await jwts_repository.delete_user_jwts(id)    
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

export const service = {
    get_all,
    get_current_one,
    get_one_by_id,
    signup,
    login,
    update_current_user,
    update_user_by_id,
    ban_user_by_id,
    delete_current_user,
    delete_one,
}