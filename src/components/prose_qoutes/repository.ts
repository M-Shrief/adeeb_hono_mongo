import { QueryFilter, Types } from 'mongoose';
/////
import { ProseQouteModel } from "../../database/schemas.js"
import { logger } from '../../utils/logger.js';
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
import { ProseQoute } from './types.js';
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { InvalidItemType } from '../../schemas/api.js';

const cache_prefix = "prose_qoutes" 

const get_all = async (limit: number, offset: number) => {
    try {
        const result = await ProseQouteModel.aggregate([
            {
                $unset: ['reviewed', 'created_at', 'updated_at', '__v'],
            },
            {
                $facet: {
                    data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                    count: [ { $count: 'total_count' } ]          // Get count
                }
            }
        ]);

        const prose_qoutes = result[0].data;
        const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: prose_qoutes,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /prose_qoutes")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as ProseQoute
        }

        let prose_qoute = await ProseQouteModel.findById(id, {
            tags: 1,
            qoute: 1,
            source: 1,
            reviewed: 1,
            //
            adeeb: 1,
            }).populate('adeeb', ['_id', 'name']);
        if (!prose_qoute) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        await cache_set(cache_key, prose_qoute)
        return prose_qoute
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /prose_qoutes/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const create_one = async(new_data: any) => {
    try {
        let new_prose_qoute = await ProseQouteModel.create({...new_data})
        return new_prose_qoute
    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in POST /prose_qoutes")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_many = async(new_data: any[]) => {
    try {
        let new_prose_qoutes: any[] = []
        let invalid_items: InvalidItemType[] = []

        for(let [index, prose_qoute] of new_data.entries()) {
            try {
                let new_prose_qoute = await ProseQouteModel.create(prose_qoute);
                new_prose_qoutes.push(new_prose_qoute)
            } catch(e: any) {
                if (e.name === "ValidationError") {
                    invalid_items.push({item_index: index, message: e.message})
                    continue
                }
                let msg: string = "Error inserting prose_qoute, try again later"
                invalid_items.push({item_index: index, message: msg})
                continue
            }
        }
        return {created_items: new_prose_qoutes, success_count: new_prose_qoutes.length, invalid_items}
    } catch(e) {
        logger.error({error:e}, "Error in POST /prose_qoutes/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_one = async(id: string, data: any) => {
    try {        
            
        let filter_q: QueryFilter<typeof ProseQouteModel> = { _id: new Types.UUID(id) }
        await ProseQouteModel.updateOne( filter_q, { $set: { ...data} })

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        if ((e.cause as any).code === "23505") {
            throw new APIError(HttpStatusCode.CONFLICT, "repository")
        }
        logger.error({error: e}, "Error in PUT /prose_qoutes/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_one = async(id: string) => {
    try {        
        let filter_q: QueryFilter<typeof ProseQouteModel> = { _id: new Types.UUID(id) }
        await ProseQouteModel.deleteOne( filter_q)

        // Delete from cache after delete to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error Delete /prose_qoutes/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    


export const repository = {
    get_all,
    get_one_by_id,
    create_one,
    create_many,
    update_one,
    delete_one,
}
