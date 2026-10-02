////
import { HttpStatusCode } from "../../utils/api.js"
import { APIError } from "../../utils/errors.js"
import { logger } from "../../utils/logger.js"
import { repository } from "./repository.js"
import { verify_token, create_permission, OP, check_permission, check_if_adminstrator, check_ownership} from "../../utils/auth.js"
import { RoleEnum } from "../../database/schemas.js"


const get_all = async(auth_header: string, limit: number, offset: number) => {
    try {
        let payload = await verify_token(auth_header)
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
            logger.error({error:e}, "Error in GET /orders")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_user_orders = async(auth_header: string, limit: number, offset: number) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]
        let authorized_list = [
            create_permission(RoleEnum.NORMAL, OP.READ)
        ]
        
        let is_authorized = check_permission(authorized_list, permissions, OP.READ)
        if (!is_authorized) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }
        let user: any = payload["user"]
        let user_id: string = user["id"]
        let repo_result = await repository.get_user_orders(user_id, limit, offset)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /orders/me")
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

        let checked_order = await repository.check_order(id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            let order_user = checked_order.get("user") 
            let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }        
        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
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

const create_orders = async(auth_header: string, new_data: any[]) => {
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
        let repo_result = await repository.create_orders(new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/many")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const create_print = async(order_id: string, auth_header: string, new_data: any) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        let order_user = checked_order.get("user") 
        let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
        if (!is_authorized) {
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }
        let repo_result = await repository.create_print(order_id, order_user_val, new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/:id/prints")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const create_prints = async(order_id: string, auth_header: string, new_data: any[]) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        let order_user = checked_order.get("user") 
        let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
        if (!is_authorized) {
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }
        let repo_result = await repository.create_prints(order_id, order_user_val, new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /orders/:id/prints/many")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_order = async(id: string, auth_header: string, data: any) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            let order_user = checked_order.get("user") 
            let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
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
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const update_print = async(order_id: string, print_id: string, auth_header: string, data: any) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            let order_user = checked_order.get("user") 
            let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }
        let repo_result = await repository.update_print(order_id, print_id, data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /orders/:order_id/prints/:print_id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_order = async(id: string, auth_header: string) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            let order_user = checked_order.get("user") 
            let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }
        let repo_result = await repository.delete_order(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in DELETE /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_print = async(order_id: string, print_id: string, auth_header: string) => {
    try {
        let payload = await verify_token(auth_header)
        if (!payload) {
            throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
        }

        let permissions = payload["permissions"] as string[]

        let checked_order = await repository.check_order(order_id)
        let is_authorized = check_if_adminstrator(permissions, OP.READ)
        if (!is_authorized) {
            let order_user = checked_order.get("user") 
            let order_user_val =  order_user == null || order_user == undefined  ? null : order_user.toString()
            if (check_ownership(order_user_val, payload) == false) {
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
            // if it's owner, we need to check if he can update it or not
            if (!checked_order.get("is_updateable")) { 
                throw new APIError(HttpStatusCode.UNAUTHORIZED, "service")
            }
        }
        let repo_result = await repository.delete_print(order_id, print_id)
        return repo_result
    } catch(e) {
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
