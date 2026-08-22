import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import {Error as MError, Types, QueryFilter} from "mongoose"
/////
import { AdeebModel } from "../../database/schemas.js"
import { one_schema, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
///// Utils
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema, describe_jwt_security } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';
import { verify_adminstrator } from '../../utils/auth.js';

export const adeeb_route = new Hono()  

const cache_prefix = "adeebs" 


adeeb_route.get(
    "/adeebs",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Get All",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Adeebs", get_all_schema(one_schema)),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    async(c) => {
        try {
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

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
            
            return c.json(
                {
                    data: adeebs,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )
        } catch(e) {
            logger.error({error:e}, "Error in GET /adeebs")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }

    }
)

adeeb_route.get(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Get One",
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Adeeb", one_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "Adeeb's not Found", base_response_schema),
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

            const result = await AdeebModel.aggregate([
                {
                    $match: { _id: new Types.UUID(id) },
                },
                {
                    $unset: ['reviewed', 'created_at', 'updated_at', '__v'],
                }
            ]);
            if (result.length == 0) {
                return c.json({message: "Adeeb's not Found"}, HttpStatusCode.NOT_FOUND)
            }
            await cache_set(cache_key, result[0])
            return c.json(result[0], HttpStatusCode.OK)

        } catch(e) {
            logger.error({error:e}, "Error in GET /adeebs/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.post(
    "/adeebs",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Create One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful added Adeeb", create_one_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "Adeeb already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    json_validator(create_one_req, "Invalid data for Adeeb"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let new_adeeb = await AdeebModel.create({name: new_data.name, bio: new_data.bio, time_period: new_data.time_period, reviewed: new_data.reviewed})
            return c.json(new_adeeb, HttpStatusCode.CREATED)
        } catch(e: any) {
            if (e.code === 11000) { // Handle Duplicate Key Error
                return c.json({ message: "Adeeb already exists"}, HttpStatusCode.CONFLICT) 
            }
            logger.error({error:e}, "Error in POST /adeebs")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.post(
    "/adeebs/many",
    describeRoute({
        tags: ["Adeebs"],
        summary: "Create Many",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", create_many_res),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema)
        },
    }),
    auth_header_validator(),
    verify_adminstrator(),
    json_validator(create_many_req, "Invalid data, can't be used to create many Adeebs"),
    async (c) => {
        try {
            let new_adeebs: any[] = []
            let new_data: any[]  = await c.req.json()
            for(let adeeb of new_data) {
                try {
                    let new_adeeb = await AdeebModel.create(adeeb);
                    new_adeebs.push(new_adeeb)
                } catch(e) {
                    continue
                    // if (e.code === 11000) { // Handle Duplicate Key Error
                    //     const field = Object.keys(e.keyPattern)[0];
                    //     const value = e.keyValue[field];
                    //     const index = e.index
                    //     console.error(`Duplicate value for ${field}: ${value}`);

                    //     return c.json({ message: "Adeeb already exists"}, HttpStatusCode.CONFLICT) 
                    // }
                }
            }
            return c.json({created_items: new_adeebs, success_count: new_adeebs.length, failed_count: new_data.length - new_adeebs.length}, HttpStatusCode.CREATED)
        } catch(e: any) {
            logger.error({error:e}, "Error in POST /adeebs/many")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.put(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
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
            
            // We use QueryFilter because it'll refuse filtering by _id
            // without making another interface.
            // Note we could've just used {_id: id} as any, but we type helpers instead
            let filter_q: QueryFilter<typeof AdeebModel> = { _id: new Types.UUID(id) }
            await AdeebModel.updateOne( filter_q, { $set: { ...data} })
            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error in PUT /adeebs/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

adeeb_route.delete(
    "/adeebs/:id",
    describeRoute({
        tags: ["Adeebs"],
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
            
            let filter_q: QueryFilter<typeof AdeebModel> = { _id: new Types.UUID(id) }
            await AdeebModel.deleteOne( filter_q)

            // Delete from cache after delete to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            logger.error({error: e}, "Error Delete /adeebs/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
