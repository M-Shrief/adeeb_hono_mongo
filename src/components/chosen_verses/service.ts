////
import { HttpStatusCode } from "../../utils/api.js"
import { APIError } from "../../utils/errors.js"
import { logger } from "../../utils/logger.js"
import { repository } from "./repository.js"

const get_all = async(limit: number, offset: number) => {
    try {
        let repo_result = await repository.get_all(limit, offset)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /chosen_verses")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }    
} 

const get_one_by_id = async(id: string) => {
    try {
        let repo_result = await repository.get_one_by_id(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /chosen_verses/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 


const create_one = async(new_data: any) => {
    try {
        let repo_result = await repository.create_one(new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /chosen_verses")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const create_many = async(new_data: any[]) => {
    try {
        let repo_result = await repository.create_many(new_data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in POST /chosen_verses/many")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
} 

const update_one = async(id: string, data: any) => {
    try {
        let repo_result = await repository.update_one(id, data)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in PUT /chosen_verses/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

const delete_one = async(id: string) => {
    try {
        let repo_result = await repository.delete_one(id)
        return repo_result
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in DELETE /chosen_verses/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "service")
        }
    }
}

export const service = {
    get_all,
    get_one_by_id,
    create_one,
    create_many,
    update_one,
    delete_one,
}