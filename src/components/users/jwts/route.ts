import { Hono } from 'hono';
import { describeRoute } from "hono-openapi";
import { getCookie} from 'hono/cookie'
///////
import { APIError } from '../../../utils/errors.js';
import { HttpStatusCode, get_described_route, describe_jwt_security } from '../../../utils/api.js';
import { base_response_schema, queries_schema_for_get_all_req, get_all_schema, InvalidItemType} from '../../../schemas/api.js';
import { set_refresh_token_cookie } from '../../../auth/utils.js';
import { auth_header_validator, id_param_validator, json_validator, query_validator, cookie_validator, param_validator } from '../../../utils/validators.js'
import { refresh_response_schema, refresh_cookie_schema, update_one_req } from './schemas.js';
import {service} from "./service.js"
import { logger } from '../../../utils/logger.js';
import { one_schema } from '../../../schemas/jwt.js';
import { auth_error_response_schema, AuthError, AuthError_ReasonEnum, new_auth_error_response} from '../../../auth/errors.js';
import { object } from 'valibot';
import { uuid_schema } from '../../../schemas/general.js';

export const jwts_route = new Hono()  

jwts_route.post(
    "/jwts/refresh",
    describeRoute({
        tags: ["JWTs"],
        summary: "Refresh",
        description: "Rotate JWTs",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Successful response", refresh_response_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    cookie_validator(refresh_cookie_schema),
    async(c) => {
        try {
            let token = getCookie(c, "refresh_token")
            if (!token) {
                throw new AuthError(AuthError_ReasonEnum.INVALID_TOKEN, "controller")
            }
            let {access_token, refresh_token}  = await service.refresh(token)

            await set_refresh_token_cookie(c, refresh_token)
            return c.json({access_token}, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /jwts/refresh")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)


jwts_route.get(
    "/jwts",
    describeRoute({
        tags: ["JWTs"],
        summary: "Get All",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All JWTs", get_all_schema(one_schema)),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string // header was already validated
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

            let resonse_body = await service.get_all(auth_header.slice(7), limit, offset) 
            return c.json(resonse_body, HttpStatusCode.OK)
        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in GET /jwts")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

jwts_route.get(
    "/jwts/:id",
    describeRoute({
        tags: ["JWTs"],
        summary: "Get One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get JWT by id", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "JWT's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string // header was already validated
            let id = c.req.param("id")
            let existing_jwt = await service.get_one_by_id(id, auth_header.slice(7))
            return c.json(existing_jwt, HttpStatusCode.OK)

        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "JWT is not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in GET /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

jwts_route.put(
    "/jwts/:id",
    describeRoute({
        tags: ["JWTs"],
        summary: "Update One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Update JWT", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "JWT's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    json_validator(update_one_req, "Invalid data for updating JWT"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            let new_data = await c.req.json()
            await service.update_one(id, auth_header.slice(7), new_data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWTname already exists"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)

jwts_route.put(
    "/jwts/:id/ban",
    describeRoute({
        tags: ["JWTs"],
        summary: "Ban One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Ban JWT"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            await service.ban_one(id, auth_header.slice(7))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWTname already exists"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)

jwts_route.put(
    "/jwts/family/:family_id/ban",
    describeRoute({
        tags: ["JWTs"],
        summary: "Ban JWTs by family_id",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Ban JWTs by family_id"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ family_id: uuid_schema }), "Invalid family's id"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("family_id")
            await service.ban_jwts_with_filters(auth_header.slice(7), undefined, id)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWTname already exists"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)

jwts_route.put(
    "/jwts/jwt/:jwt_id/ban",
    describeRoute({
        tags: ["JWTs"],
        summary: "Ban JWTs by jwt_id",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Ban JWTs by jwt_id"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    param_validator(object({ jwt_id: uuid_schema }), "Invalid jwt's id"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("jwt_id")
            await service.ban_jwts_with_filters(auth_header.slice(7), id, undefined)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWTname already exists"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)

jwts_route.delete(
    "/jwts/cleanup",
    describeRoute({
        tags: ["JWTs"],
        summary: "Cleanup",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Cleanup"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "JWT's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            await service.cleanup(auth_header.slice(7))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWT is refrenced in other tables"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in DELETE /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

jwts_route.delete(
    "/jwts/:id",
    describeRoute({
        tags: ["JWTs"],
        summary: "Delete One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Delete JWT"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "JWT's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            await service.delete_one(id, auth_header.slice(7))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "JWT is refrenced in other tables"}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in DELETE /jwts/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)
