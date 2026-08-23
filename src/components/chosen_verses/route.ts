import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { QueryFilter, Types } from 'mongoose';
/////
import { ChosenVerseModel } from '../../database/schemas.js';
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
///// Utils
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema, describe_jwt_security } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';
import { verify_adminstrator } from '../../utils/auth.js';

export const chosen_verses_route = new Hono()  

const cache_prefix = "chosen_verses" 


chosen_verses_route.get(
    "/chosen_verses",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All ChosenVerses", get_all_schema(one_schema)),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    async(c) => {
        try {
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

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

            return c.json(
                {
                    data: chosen_verses,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )
        } catch(e) {
            logger.error({error:e}, "Error in GET /chosen_verses")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }

    }
)

chosen_verses_route.get(
    "/chosen_verses/:id",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get ChosenVerse", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "ChosenVerse's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")

            let cache_key = format_key_by_id(cache_prefix, id)
            let cache_res = await cache_get(cache_key)

            if(cache_res) {
                return c.json(cache_res, HttpStatusCode.OK)
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
                .populate('adeeb', ['name', 'time_period'])
                .populate('poem', ['_id', 'intro']);
            if (!chosen_verse) {
                return c.json({message: "ChosenVerse's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            await cache_set(cache_key, chosen_verse)

            return c.json(chosen_verse, HttpStatusCode.OK)

        } catch(e) {
            logger.error({error:e}, "Error in GET /chosen_verses/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

chosen_verses_route.post(
    "/chosen_verses",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Create One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added ChosenVerse", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "ChosenVerse already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    json_validator(create_one_req, "Invalid data for ChosenVerse"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_chosen_verse = await ChosenVerseModel.create({...new_data})
            if (!new_chosen_verse) {
                return c.json({ message: "ChosenVerse already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }
            return c.json(new_chosen_verse, HttpStatusCode.CREATED)
        } catch(e: any) {
            if (e.code === 11000) { // Handle Duplicate Key Error
                return c.json({ message: "ChosenVerse already exists"}, HttpStatusCode.CONFLICT) 
            }
            logger.error({error:e}, "Error in POST /chosen_verses")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

chosen_verses_route.post(
    "/chosen_verses/many",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Create Many",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    json_validator(create_many_req, "Invalid data, can't be used to create many ChosenVerses"),
    async (c) => {
        try {
            let new_chosen_verses: any[] = []
            let new_data: any[] = await c.req.json()
            for(let chosen_verse of new_data) {
                try {
                    let new_chosen_verse = await ChosenVerseModel.create(chosen_verse);
                    new_chosen_verses.push(new_chosen_verse)
                } catch(e) {
                    continue
                }
            }

            return c.json({created_items: new_chosen_verses, success_count: new_chosen_verses.length, failed_count: new_data.length - new_chosen_verses.length}, HttpStatusCode.CREATED)
        } catch(e) {
            logger.error({error:e}, "Error in POST /chosen_verses/many")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

chosen_verses_route.put(
    "/chosen_verses/:id",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Update One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Updated Successfully"),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request, try again later.", base_response_schema),
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    id_param_validator(),
    json_validator(update_req, "Invalid data for update"),
    async(c) => {
        try {
            let id = c.req.param("id")
            let data = await c.req.json()
            
            let filter_q: QueryFilter<typeof ChosenVerseModel> = { _id: new Types.UUID(id) }
            await ChosenVerseModel.updateOne( filter_q, { $set: { ...data} })

            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)


            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error in PUT /chosen_verses/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

chosen_verses_route.delete(
    "/chosen_verses/:id",
    describeRoute({
        tags: ["ChosenVerses"],
        summary: "Delete One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Deleted Successfully"),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request, try again later.", base_response_schema),
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    id_param_validator(),
    async (c) => {
        try {
            let id = c.req.param("id")
            
            let filter_q: QueryFilter<typeof ChosenVerseModel> = { _id: new Types.UUID(id) }
            await ChosenVerseModel.deleteOne( filter_q)

            // Delete from cache after delete to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error in DELETE /chosen_verses/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
