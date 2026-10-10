////
import { RoleEnum } from "../../database/schemas.js"
import { HttpStatusCode } from "../../utils/api.js"
import { check_if_adminstrator, verify_token, OP, create_permission, check_permission, sign_token, compare_password } from "../../utils/auth.js"
import { APIError } from "../../utils/errors.js"
import * as auth_utils from '../../utils/auth.js'
import { logger } from "../../utils/logger.js"
import { repository } from "./repository.js"

const get_all = async(auth_header: string, limit: number, offset: number) => {
    try {
        let payload = await verify_token(auth_header) // header was already validated
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let repo_result = await repository.get_all(limit, offset)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /users")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_current_one = async(auth_header: string) => {
    try {
        let payload = await verify_token(auth_header) 
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let authorized_list = [
            create_permission(RoleEnum.NORMAL, OP.READ),
        ]
        
        let is_authorized = check_permission(authorized_list, permissions, OP.READ)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let user = payload["user"] as any
        let id = user.id as string

        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /users/me")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const get_one_by_id = async(id: string, auth_header: string) => {
    try {
        let payload = await verify_token(auth_header) 
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let is_authorized = auth_utils.check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
    
        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
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
        let access_token = await sign_token(new_user.get("_id").toString(), new_user.get("username"), new_user.get("roles"))
        return {user: {id: new_user.id, username: new_user.username, roles: new_user.roles}, access_token}
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
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let access_token = await sign_token(existing_user.id, existing_user.get("username"), existing_user.get("roles"))
        return {user: {id: existing_user.id, username: existing_user.username, roles: existing_user.roles}, access_token}
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in querying user by username for login request")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const update_current_user = async(auth_header: string, data: any) => {
    try {
        let payload = await verify_token(auth_header) // header was already validated
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let authorized_list = [
            create_permission(RoleEnum.NORMAL, OP.WRITE),
        ]
        
        let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
        
        let user = payload["user"] as any
        let id = user.id as string
        let repo_result = await repository.update_current_user(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/me")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_user_by_id = async(id: string, auth_header: string, data: any) => {
    try {
        let payload = await verify_token(auth_header) // header was already validated
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let is_authorized = check_if_adminstrator(permissions, OP.WRITE)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
        
        let repo_result = await repository.update_user_by_id(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const ban_user_by_id = async(id: string, auth_header: string) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let is_authorized = check_if_adminstrator(permissions, OP.WRITE)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
        
        let repo_result = await repository.ban_user_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /users/:id/ban")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_current_user = async(auth_header: string) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let authorized_list = [
            create_permission(RoleEnum.NORMAL, OP.WRITE),
        ]
        
        let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
    
        
        let user = payload["user"] as any
        let id = user.id as string
        let repo_result = await repository.delete_one(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}


const delete_one = async(id: string, auth_header: string) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let is_authorized = check_if_adminstrator(permissions, OP.WRITE)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
    
        let repo_result = await repository.delete_one(id)
        return repo_result
    } catch(e) {
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