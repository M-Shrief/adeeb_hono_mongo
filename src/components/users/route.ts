import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
/////
import { one_schema } from "../../schemas/user.js"
import { signup_req, login_req, user_authorized_res, update_current_req, update_one_req } from './schema.js'
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { base_response_schema, queries_schema_for_get_all_req, get_all_schema} from '../../schemas/api.js';
import { HttpStatusCode, get_described_route, describe_jwt_security } from '../../utils/api.js';
import { service } from './service.js';
import { APIError } from '../../utils/errors.js';
import { set_refresh_token_cookie } from '../../auth/utils.js';
import { auth_error_response_schema, AuthError, new_auth_error_response } from '../../auth/errors.js';

export const users_route = new Hono() 

users_route.get(
    "/users",
    describeRoute({
        tags: ["Users"],
        summary: "Get All",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Users", get_all_schema(one_schema)),
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
            logger.error({error: e}, "Error in GET /users")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

users_route.get(
    "/users/me",
    describeRoute({
        tags: ["Users"],
        summary: "Get Current User",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Current User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string // header was already validated
            let existing_user = await service.get_current_one(auth_header.slice(7))
            return c.json(existing_user, HttpStatusCode.OK)

        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "User is not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in GET /users/me")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

users_route.get(
    "/users/:id",
    describeRoute({
        tags: ["Users"],
        summary: "Get One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get User by ID", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string // header was already validated
            let id = c.req.param("id")
            let existing_user = await service.get_one_by_id(id, auth_header.slice(7))
            return c.json(existing_user, HttpStatusCode.OK)

        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "User is not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in GET /users/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

users_route.post(
    "/users/signup",
    describeRoute({
        tags: ["Users"],
        summary: "Signup",
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful signup", user_authorized_res),
           ...get_described_route(HttpStatusCode.CONFLICT, "User already exists", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(signup_req, "Invalid data for User"),
    async(c) => {
        try {
            let new_data = await c.req.json()
            let {res_body, refresh_token} = await service.signup(new_data)
            await set_refresh_token_cookie(c, refresh_token)
            return c.json(res_body, HttpStatusCode.CREATED)
        } catch(e) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: e.message}, HttpStatusCode.CONFLICT)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error in POST /users/signup")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

users_route.post(
    "/users/login",
    describeRoute({
        tags: ["Users"],
        summary: "Login",
        responses: {
           ...get_described_route(HttpStatusCode.CREATED, "Successful login", user_authorized_res),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(login_req, "Invalid data for User"),
    async(c) => {
        try {
            let login_data = await c.req.json()
            let {res_body, refresh_token} = await service.login(login_data)
            await set_refresh_token_cookie(c, refresh_token)
            return c.json(res_body, HttpStatusCode.CREATED)
        } catch(e) {
             if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                   case HttpStatusCode.NOT_FOUND:
                        return c.json({message: "User is not Found"}, HttpStatusCode.NOT_FOUND)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error:e}, "Error is POST /users/signup")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)

users_route.put(
    "/users/me",
    describeRoute({
        tags: ["Users"],
        summary: "Update Current User",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Update Current User"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    json_validator(update_current_req, "Invalid data for updating User"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let new_data = await c.req.json()
            await service.update_current_user(auth_header.slice(7), new_data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "User already exists"}, HttpStatusCode.CONFLICT)
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message:e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /users/me")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)


users_route.put(
    "/users/:id",
    describeRoute({
        tags: ["Users"],
        summary: "Update One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Update User"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    json_validator(update_one_req, "Invalid data for updating User"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            let new_data = await c.req.json()
            await service.update_user_by_id(id, auth_header.slice(7), new_data)
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e: any) {
            if(e instanceof AuthError) {
                return new_auth_error_response(c, e.reason) 
            }
            if(e instanceof APIError) {
                switch(e.status_code) {
                    case HttpStatusCode.CONFLICT:
                        return c.json({message: "User already exists"}, HttpStatusCode.CONFLICT)
                    case HttpStatusCode.UNPROCESSABLE_ENTITY:
                        return c.json({message:e.message}, HttpStatusCode.UNPROCESSABLE_ENTITY)
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in PUT /users/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)

users_route.put(
    "/users/:id/ban",
    describeRoute({
        tags: ["Users"],
        summary: "Ban User",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Banned User"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            let id = c.req.param("id")
            await service.ban_user_by_id(id, auth_header.slice(7))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
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
            logger.error({error: e}, "Error in PUT /users/:id/ban")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }

    }    
)


users_route.delete(
    "/users/me",
    describeRoute({
        tags: ["Users"],
        summary: "Delete Current User",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Delete Current User"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization") as string
            await service.delete_current_user(auth_header.slice(7))
            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
            
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
            logger.error({error: e}, "Error in DELETE /users/me")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

users_route.delete(
    "/users/:id",
    describeRoute({
        tags: ["Users"],
        summary: "Delete One",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Delete User"),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", auth_error_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
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
                    default:
                        return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
                }
            }
            logger.error({error: e}, "Error in DELETE /users/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)
