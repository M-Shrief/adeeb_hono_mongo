import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
/////
import { one_schema as order_schema } from "../../schemas/order.js";
import { one_schema as print_schema} from "../../schemas/print.js";
import { create_order_req, create_order_res, create_many_orders_req, create_many_orders_res, create_print_res, create_print_req, update_order_req, update_print_req, create_many_prints_res, create_many_prints_req} from './schema.js'
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, param_validator, query_validator } from '../../utils/validators.js'
import { base_response_schema, queries_schema_for_get_all_req, get_all_schema, InvalidItemType} from '../../schemas/api.js';
import { HttpStatusCode, get_described_route, describe_jwt_security } from '../../utils/api.js';
import { object } from 'valibot';
import { uuid_schema } from '../../schemas/general.js';
import { service } from './service.js';
import { APIError } from '../../utils/errors.js';


export const orders_route = new Hono() 

const cache_prefix = "orders" 

orders_route.get(
    "/orders",
    describeRoute({
        tags: ["Orders"],
        summary: "Get All",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Orders", get_all_schema(order_schema)),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string        
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0
            let resonse_body = await service.get_all(auth_header, limit, offset) 
            return c.json(resonse_body, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in GET /orders/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.get(
    "/orders/me",
    describeRoute({
        tags: ["Orders"],
        summary: "Current User Orders",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Orders", get_all_schema(order_schema)),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0
            let resonse_body = await service.get_user_orders(auth_header, limit, offset) 
            return c.json(resonse_body, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in GET /orders/me")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)


orders_route.get(
    "/orders/:id",
    describeRoute({
        tags: ["Orders"],
        summary: "Get One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Order", order_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "NOT FOUND", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string // header was already validated
            let id = c.req.param("id")
            let existing_user = await service.get_one_by_id(id, auth_header)
            return c.json(existing_user, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "Order is not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in GET /orders/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.post(
    "/orders",
    describeRoute({
        tags: ["Orders"],
        summary: "Create Order",
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Order", create_order_res),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for order", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_order_req, "Invalid data for Order"),
    async(c) => {
        try {
            let data = await c.req.json()
            let response_body = await service.create_order(data)
            return c.json(response_body, HttpStatusCode.CREATED)
        } catch(e: any) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message: e.message}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /orders")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.post(
    "/orders/many",
    describeRoute({
        tags: ["Orders"],
        summary: "Create Many Orders",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Orders", create_many_orders_res),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for orders", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    json_validator(create_many_orders_req, "Invalid data for Order"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let data: any[] = await c.req.json()
            let response_body = await service.create_orders(auth_header, data)
            return c.json(response_body, HttpStatusCode.CREATED)
        } catch(e: any) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /orders/many")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.post(
    "/orders/:order_id/prints",
    describeRoute({
        tags: ["Orders"],
        summary: "Add Print",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Print", create_print_res),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for Print", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ order_id: uuid_schema }), "Invalid Order's id"),
    json_validator(create_print_req, "Invalid data for Print"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let order_id = c.req.param("order_id")
            let data = await c.req.json()
            let response_body = await service.create_print(order_id, auth_header, data)
            return c.json(response_body, HttpStatusCode.CREATED)
        } catch(e: any) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message: e.message}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /orders/:order_id/prints")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.post(
    "/orders/:order_id/prints/many",
    describeRoute({
        tags: ["Orders"],
        summary: "Add Many Print",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Prints", create_many_prints_res),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ order_id: uuid_schema }), "Invalid Order's id"),
    json_validator(create_many_prints_req, "Invalid data for Print"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let order_id = c.req.param("order_id")
            let data = await c.req.json()
            let response_body = await service.create_prints(order_id, auth_header, data)
            return c.json(response_body, HttpStatusCode.CREATED)
        } catch(e: any) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /orders/:order_id/prints/many")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.put(
    "/orders/:id",
    describeRoute({
        tags: ["Orders"],
        summary: "Update Order",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Updated Order successfully"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for Order", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    json_validator(update_order_req, "Invalid data for Order"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            let data = await c.req.json()
            await service.update_order(id, auth_header, data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message:e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in PUT /orders/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.put(
    "/orders/:order_id/prints/:print_id",
    describeRoute({
        tags: ["Orders"],
        summary: "Update Print",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Updated Print successfully"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for Print", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ order_id: uuid_schema }), "Invalid Order's id"),
    param_validator(object({ print_id: uuid_schema }), "Invalid Print's id"),
    json_validator(update_print_req, "Invalid data for Print"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let data = await c.req.json()
            let order_id = c.req.param("order_id")
            let print_id = c.req.param("print_id")
            await service.update_print(order_id, print_id, auth_header, data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message:e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in PUT /orders/:order_id/prints/:print_id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)


orders_route.delete(
    "/orders/:id",
    describeRoute({
        tags: ["Orders"],
        summary: "Delete Order",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Deleted Order successfully"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            await service.delete_order(id, auth_header)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)

        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in Delete /orders/:id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

orders_route.delete(
    "/orders/:order_id/prints/:print_id",
    describeRoute({
        tags: ["Orders"],
        summary: "Delete Print",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Deleted Print successfully"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ order_id: uuid_schema }), "Invalid Order's id"),
    param_validator(object({ print_id: uuid_schema }), "Invalid Print's id"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let order_id = c.req.param("order_id")
            let print_id = c.req.param("print_id")
            await service.delete_print(order_id, print_id, auth_header)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.UNAUTHORIZED:
                        return c.json({message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in DELETE /orders/:order_id/prints/:print_id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
