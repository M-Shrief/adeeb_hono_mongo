import { QueryFilter, Types } from 'mongoose';
////////////
import { PoemModel } from "../../database/schemas.js"
import { logger } from '../../utils/logger.js';
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { InvalidItemType } from '../../schemas/api.js';
import { Poem } from './type.js';


const cache_prefix = "poems" 

const get_all = async (limit: number, offset: number) => {
    try {
            const result = await PoemModel.aggregate([
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

            const poems = result[0].data;
            const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: poems,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /poems")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as Poem
        }

            let result = await PoemModel.aggregate([
                {
                    $match: { _id: new Types.UUID(id) },
                },
                {
                    $unset: ['reviewed', 'created_at', 'updated_at', '__v'],
                },
                {
                        $lookup: {
                        from: 'adeebs', // Name of the collection to join (usually lowercase plural)
                        localField: 'adeeb', // The ObjectId field in your schema
                        foreignField: '_id', // The _id field in the target collection
                        as: 'adeeb', // The new array field containing the joined document
                        pipeline: [
                            {
                                $project: {
                                    _id: 1,
                                    name: 1
                                },
                            },
                        ],
                    }
                },
                {
                    $unwind: '$adeeb' // Unwind to get a single object instead of an array
                },
                {
                    $lookup: {
                        from: 'chosenverses',
                        localField: '_id',
                        foreignField: 'poem',
                        as: 'chosen_verses',
                        pipeline: [
                            {
                                $unset: ['adeeb', 'poem', 'tags', 'reviewed', 'created_at', 'updated_at', '__v'],
                            },
                        ],
                    },
                }
            ])
            if (result.length == 0) {
                throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
            }
            
            await cache_set(cache_key, result[0])
            return result[0]
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /poems/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const create_one = async(new_data: any) => {
    try {
        let new_poem = await PoemModel.create({...new_data})            
        return new_poem
        
    } catch(e: any) {
        if (e.code === 11000) { // Handle Duplicate Key Error
            throw new APIError(HttpStatusCode.CONFLICT, "repository", "Poem already exists")
        }
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in POST /poems")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_many = async(new_data: any[]) => {
    try {
        let new_poems: any[] = []
        let invalid_items: InvalidItemType[] = []
        for(let [index, poem] of new_data.entries()) {
            try {
                let new_poem = await PoemModel.create(poem);
                new_poems.push(new_poem)
            } catch(e: any) {
                let msg: string = ""
                if (e.code === 11000) { // Handle Duplicate Key Error
                    msg =  "Poem already exists"
                } else if (e.name === "ValidationError") {
                    msg = e.message
                } else {
                    msg =  "Error inserting poem, try again later"
                }
                invalid_items.push({item_index: index, message: msg})
                continue
            }
        }
        return {created_items: new_poems, success_count: new_poems.length, invalid_items}
    } catch(e) {
        logger.error({error:e}, "Error in POST /poems/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_one = async(id: string, data: any) => {
    try {      
        let filter_q: QueryFilter<typeof PoemModel> = { _id: new Types.UUID(id) }
        await PoemModel.updateOne( filter_q, { $set: { ...data} })
        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        if (e.code === 11000) {
            throw new APIError(HttpStatusCode.CONFLICT, "repository")
        }
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error: e}, "Error in PUT /poems/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_one = async(id: string) => {
    try {       
        let filter_q: QueryFilter<typeof PoemModel> = { _id: new Types.UUID(id) }
        await PoemModel.deleteOne( filter_q)

        // Delete from cache after delete to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error Delete /poems/:id")
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
