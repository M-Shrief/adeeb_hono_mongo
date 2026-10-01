import { QueryFilter, Types } from 'mongoose';
////////////
import { logger } from '../../utils/logger.js';
import { ChosenVerseModel } from '../../database/schemas.js';
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
import { ChosenVerse } from './types.js';
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { InvalidItemType } from '../../schemas/api.js';

const cache_prefix = "chosen_verses" 

const get_all = async (limit: number, offset: number) => {
    try {
        const result = await ChosenVerseModel.aggregate([
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
        
        const chosen_verses = result[0].data;
        const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

        return {
            data: chosen_verses,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /chosen_verses")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as ChosenVerse
        }

        let chosen_verse = await ChosenVerseModel.findById(id, {
            tags: 1,
            verses: 1,
            is_couplet: 1,
            reviewed: 1,
            //
            adeeb: 1,
            poem: 1,
            })
            .populate('adeeb', ['_id', 'name'])
            .populate('poem', ['_id', 'intro']);
        if (!chosen_verse) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        await cache_set(cache_key, chosen_verse)
        return chosen_verse
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /chosen_verses/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const create_one = async(new_data: any) => {
    try {
        let new_chosen_verse = await ChosenVerseModel.create({...new_data})
        return new_chosen_verse
    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in POST /chosen_verses")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_many = async(new_data: any[]) => {
    try {
        let new_chosen_verses: any[] = []
        let invalid_items: InvalidItemType[] = []
        for(let [index, chosen_verse] of new_data.entries()) {
            try {
                let new_chosen_verse = await ChosenVerseModel.create(chosen_verse);
                new_chosen_verses.push(new_chosen_verse)
            } catch(e: any) {
                if (e.name === "ValidationError") {
                    invalid_items.push({item_index: index, message: e.message})
                    continue
                }
                invalid_items.push({item_index: index, message: "Error inserting chosen_verse, try again later"})
                continue
            }
        }
        return {created_items: new_chosen_verses, success_count: new_chosen_verses.length, invalid_items}
    } catch(e) {
        logger.error({error:e}, "Error in POST /chosen_verses/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_one = async(id: string, data: any) => {
    try {        
        let filter_q: QueryFilter<typeof ChosenVerseModel> = { _id: new Types.UUID(id) }
        await ChosenVerseModel.updateOne( filter_q, { $set: { ...data} })

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        logger.error({error: e}, "Error in PUT /chosen_verses/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_one = async(id: string) => {
    try {        
        let filter_q: QueryFilter<typeof ChosenVerseModel> = { _id: new Types.UUID(id) }
        await ChosenVerseModel.deleteOne( filter_q)

        // Delete from cache after delete to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)

        return null
    } catch(e: any) {
        if ((e.cause as any).code === "23503") {
            throw new APIError(HttpStatusCode.CONFLICT, "repository")
        }
        logger.error({error: e}, "Error Delete /chosen_verses/:id")
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
