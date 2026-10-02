import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
/////
import {one_schema} from "../../schemas/chosen_verse.js"
import { get_one_res, create_many_req, create_many_res, create_one_req, create_one_res, update_req } from './schema.js'
///// Utils
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { base_response_schema, queries_schema_for_get_all_req, get_all_schema} from '../../schemas/api.js';
import { HttpStatusCode, get_described_route, describe_jwt_security } from '../../utils/api.js';
import { logger } from '../../utils/logger.js';
import { verify_adminstrator } from '../../utils/auth.js';
import { service } from './service.js';
import { APIError } from '../../utils/errors.js';

export const chosen_verses_route = new Hono()  

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
            let resonse_body = await service.get_all(limit, offset) 
            return c.json(resonse_body, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof APIError) {
                return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
            }
            // if the error originated from the route/controller then log it:
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
           ...get_described_route(HttpStatusCode.OK, "Get ChosenVerse", get_one_res),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "ChosenVerse's not Found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    id_param_validator(),
    async(c) => {
        try {
            let id = c.req.param("id")
            let chosen_verse = await service.get_one_by_id(id)
            return c.json(chosen_verse, HttpStatusCode.OK)

        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "ChosenVerse's not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
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
            let new_chosen_verse = await service.create_one(new_data)
            return c.json(new_chosen_verse, HttpStatusCode.CREATED)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message: e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
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
            let new_data: any[] = await c.req.json()
            let response_body = await service.create_many(new_data)
            return c.json(response_body, HttpStatusCode.CREATED)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.BAD_REQUEST:
                        return c.json({message: e.message}, HttpStatusCode.BAD_REQUEST)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
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
            
            await service.update_one(id, data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e: any) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message:e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
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
            
            await service.delete_one(id)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in DELETE /chosen_verses/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
