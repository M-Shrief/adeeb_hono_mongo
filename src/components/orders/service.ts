////
import { HttpStatusCode } from "../../utils/api.js"
import { APIError } from "../../utils/errors.js"
import { logger } from "../../utils/logger.js"
import { repository } from "./repository.js"
import { verify_jwt} from "../../auth/jwt.js"
import { verify_admin_user, check_admin_permissions, check_item_ownership} from "../../auth/utils.js"
import { AuthError, AuthError_ReasonEnum } from "../../auth/errors.js"


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
            logger.error({error:e}, "Error in GET /orders")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_user_orders = async(token: string, limit: number, offset: number) => {
    try {
        // even if user is banned, he should be able to read his data.
        // so don't check his permission and we don't use verify_normal_user()
        let result = await verify_jwt(token) 
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let repo_result = await repository.get_user_orders(result.claims.user!.id, limit, offset)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /orders/me")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_one_by_id = async(id: string, token: string) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "read")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }        
        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 


const create_order = async(new_data: any) => {
    try {
        let repo_result = await repository.create_order(new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const create_orders = async(token: string, new_data: any[]) => {
    try {
        await verify_admin_user(token, "write")
        let repo_result = await repository.create_orders(new_data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/many")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const create_print = async(order_id: string, token: string, new_data: any) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }
        let repo_result = await repository.create_print(order_id, checked_order.user.toString(), new_data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/:id/prints")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const create_prints = async(order_id: string, token: string, new_data: any[]) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }
        let repo_result = await repository.create_prints(order_id, checked_order.user.toString(), new_data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/:id/prints/many")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_order = async(id: string, token: string, data: any) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's updated by the owner, then remove admin's related fields -- aka assign them to undefine.
            data.is_updateable = undefined
            data.status = undefined
            data.reviewed = undefined
            data.user = undefined
        }
        let repo_result = await repository.update_order(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_print = async(order_id: string, print_id: string, token: string, data: any) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }
        let repo_result = await repository.update_print(order_id, print_id, data)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /orders/:order_id/prints/:print_id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_order = async(id: string, token: string) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }
        let repo_result = await repository.delete_order(id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in DELETE /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_print = async(order_id: string, print_id: string, token: string) => {
    try {
        let result = await verify_jwt(token)
        if (result.error) {
            throw new AuthError(result.error, "service")
        }
        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_admin_permissions(result.claims.permissions!, "write")
        if (!is_authorized) {
            if (check_item_ownership(checked_order.user.toString(), result.claims) == false) {
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.is_updateable) { 
                throw new AuthError(AuthError_ReasonEnum.PERM, "service")
            }
        }
        let repo_result = await repository.delete_print(order_id, print_id)
        return repo_result
    } catch(e) {
        if(e instanceof AuthError) {
            throw e
        }
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in DELETE /orders/:order_id/prints/:print_id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

export const service = {
    get_all,
    get_user_orders,
    get_one_by_id,
    create_order,
    create_orders,
    create_print,
    create_prints,
    update_order,
    update_print,
    delete_order,
    delete_print,
}
