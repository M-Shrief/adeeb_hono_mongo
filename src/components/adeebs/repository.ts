import {Error as MError, Types, QueryFilter} from "mongoose"
////////////
import { AdeebModel } from '../../database/schemas.js';
import { logger } from '../../utils/logger.js';
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
import { Adeeb } from './types.js';
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { InvalidItemType } from '../../schemas/api.js';

const cache_prefix = "adeebs" 

const get_all = async (limit: number, offset: number) => {
    try {
        const result = await AdeebModel.aggregate([
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

        const adeebs = result[0].data;
        const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: adeebs,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /adeebs")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as Adeeb
        }

        const result: Adeeb[] = await AdeebModel.aggregate([
            {
                $match: { _id: new Types.UUID(id) },
            },
            {
                $unset: ['reviewed', 'created_at', 'updated_at', '__v'],
            },
            {
                $lookup: {
                from: 'poems',
                localField: '_id',
                foreignField: 'adeeb',
                as: 'poems',
                pipeline: [
                    {
                        $unset: ['adeeb', 'verses', 'is_couplet', 'reviewed', 'created_at', 'updated_at', '__v'],
                    },
                ],
                },
            },
            {
                $lookup: {
                from: 'proseqoutes',
                localField: '_id',
                foreignField: 'adeeb',
                as: 'prose_qoutes',
                pipeline: [
                    {
                        $unset: ['adeeb', 'tags', 'reviewed', 'created_at', 'updated_at', '__v'],
                    },
                ],
                },
            },
            {
                $lookup: {
                from: 'chosenverses',
                localField: '_id',
                foreignField: 'adeeb',
                as: 'chosen_verses',
                pipeline: [
                    {
                        $unset: ['adeeb', 'poem', 'tags', 'reviewed', 'created_at', 'updated_at', '__v'],
                    },
                ],
                },
            },
        ]);
        if (result.length == 0) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        await cache_set(cache_key, result[0])
        return result[0]
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /adeebs/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const create_one = async(new_data: any) => {
    try {
        let new_adeeb = await AdeebModel.create({name: new_data.name, bio: new_data.bio, time_period: new_data.time_period, reviewed: new_data.reviewed})
        return new_adeeb
    } catch(e: any) {
        if (e.code === 11000) { // Handle Duplicate Key Error
            throw new APIError(HttpStatusCode.CONFLICT, "repository", "Adeeb already exists")
        }
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error:e}, "Error in POST /adeebs")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_many = async(new_data: any[]) => {
    try {
        let new_adeebs: any[] = []
        let invalid_items: InvalidItemType[] = []
        for(let [index, adeeb] of new_data.entries()) {
            try {
                let new_adeeb = await AdeebModel.create(adeeb);
                new_adeebs.push(new_adeeb)
            } catch(e: any) {
                let msg: string = ""
                if (e.code === 11000) { // Handle Duplicate Key Error
                    // const field = Object.keys(e.keyPattern)[0];
                    // const value = e.keyValue[field];
                    // const index = e.index
                    // console.error(`Duplicate value for ${field}: ${value}`);
                    msg =  "Adeeb already exists"
                } else {
                    msg =  "Error inserting adeeb, try again later"
                }
                invalid_items.push({item_index: index, message: msg})
                continue
            }
        }
        return {created_items: new_adeebs, success_count: new_adeebs.length, invalid_items}
    } catch(e) {
        logger.error({error:e}, "Error in POST /adeebs/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_one = async(id: string, data: any) => {
    try {        
        // We use QueryFilter because it'll refuse filtering by _id
        // without making another interface.
        // Note we could've just used {_id: id} as any, but we type helpers instead
        let filter_q: QueryFilter<typeof AdeebModel> = { _id: new Types.UUID(id) }
        await AdeebModel.updateOne( filter_q, { $set: { ...data} })
        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)
        return null
    } catch(e: any) {
        // if ((e.cause as any).code === "23505") {
        //     throw new APIError(HttpStatusCode.CONFLICT, "repository")
        // }
        logger.error({error: e}, "Error in PUT /adeebs/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_one = async(id: string) => {
    try {        
        let filter_q: QueryFilter<typeof AdeebModel> = { _id: new Types.UUID(id) }
        await AdeebModel.deleteOne( filter_q)

        // Delete from cache after delete to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)
        return null
    } catch(e: any) {
        // if ((e.cause as any).code === "23503") {
        //     throw new APIError(HttpStatusCode.CONFLICT, "repository")
        // }
        logger.error({error: e}, "Error Delete /adeebs/:id")
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
