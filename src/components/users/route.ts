import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { QueryFilter, Types } from 'mongoose';
/////
import { RoleEnum, UserModel } from "../../database/schemas.js"
import { one_schema, signup_req, login_req, user_authorized_res, update_current_req, update_one_req } from './schema.js'
///// Utils
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema, describe_jwt_security } from '../../utils/api.js';
import { compare_password, hash_password, sign_token, verify_token, create_permission, OP, check_permission, RoleEnumType } from "../../utils/auth.js"

export const users_route = new Hono() 




users_route.get(
    "/users",
    describeRoute({
        tags: ["Users"],
        summary: "Get All",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Users", get_all_schema(one_schema)),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    query_validator(queries_schema_for_get_all_req),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.MANAGMENT, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
                create_permission(RoleEnum.ANALYTICS, OP.READ),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.READ)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

            const result = await UserModel.aggregate([
                {
                    $unset: ['password', 'reviewed', 'created_at', 'updated_at', '__v'],
                },
                {
                    $facet: {
                        data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                        count: [ { $count: 'total_count' } ]          // Get count
                    }
                }
            ]);

            const users = result[0].data;
            const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

            return c.json(
                {
                    data: users,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )        

        } catch(e) {
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
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.NORMAL, OP.READ),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.READ)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let user = payload["user"] as any
            let id = user.id

            let existing_user = await UserModel.findById(id, {
                _id: 1,
                username: 1,
                roles: 1,
            });

            if (!existing_user) {
                return c.json({message: "User's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(existing_user, HttpStatusCode.OK)

        } catch(e) {
            logger.error({error: e}, "Error in GET /users/me")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)

users_route.get(
    "/users/:id",
    describeRoute({
        tags: ["Users"],
        summary: "Get User By ID",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get Current User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.MANAGMENT, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
                create_permission(RoleEnum.ANALYTICS, OP.READ),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.READ)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let id = c.req.param("id")
            let existing_user = await UserModel.findById(id, {
                _id: 1,
                username: 1,
                roles: 1,
            });

            if (!existing_user) {
                return c.json({message: "User's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            return c.json(existing_user, HttpStatusCode.OK)

        } catch(e) {
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
            let hashed_pass = await hash_password(new_data.password)

            // Ensuring integrity, by removing duplocates and having Normal role as a must.
            let roles = new Set<RoleEnumType>(new_data.roles as RoleEnumType[])
            roles.add(RoleEnum.NORMAL)

            let new_user = await UserModel.create({username: new_data.username, password: hashed_pass, roles: [...roles] as any} )
               
            let access_token = await sign_token(new_user.get("_id").toString(), new_user.get("username"), new_user.get("roles"))


            return c.json({user: {id: new_user.id, username: new_user.username, roles: new_user.roles}, access_token}, HttpStatusCode.CREATED)
        } catch(e: any) {
            if (e.code === 11000) { // Handle Duplicate Key Error
                return c.json({ message: "User already exists"}, HttpStatusCode.CONFLICT) 
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
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(login_req, "Invalid data for User"),
    async(c) => {
        try {
            let login_data = await c.req.json()

            let filter_q: QueryFilter<typeof UserModel> = { username:  login_data.username}
            let existing_user = await UserModel.findOne(filter_q, {
                _id: 1,
                username: 1,
                password: 1,
                roles: 1,
            })

            if (!existing_user) {
                return c.json({ message: "Username doesn't exist"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let pass_is_correct = await compare_password(login_data.password, existing_user.get("password"))
            if (!pass_is_correct) {
                return c.json({ message: "Password isn't correct"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let access_token = await sign_token(existing_user.id, existing_user.get("username"), existing_user.get("roles"))

            return c.json({user: {id: existing_user.id, username: existing_user.username, roles: existing_user.roles}, access_token}, HttpStatusCode.CREATED)
        } catch(e) {
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
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Update Current User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    json_validator(update_current_req, "Invalid data for updating User"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.NORMAL, OP.WRITE),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let user = payload["user"] as any
            let id = user.id

            let new_data = await c.req.json()
            let hashed_pass = undefined
            if (new_data.password) {
                hashed_pass = await hash_password(new_data.password)
            }

            let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
            await UserModel.updateOne( filter_q, { $set: {username: new_data.username, password: hashed_pass }})

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
        } catch(e) {
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
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Update User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    json_validator(update_one_req, "Invalid data for updating User"),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.MANAGMENT, OP.WRITE),
                create_permission(RoleEnum.DBA, OP.WRITE),
                create_permission(RoleEnum.ANALYTICS, OP.WRITE),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let id = c.req.param("id")


            // set() ignores fields with undefined value, so we don't need conditions
            let new_data = await c.req.json()
            let hashed_pass = undefined
            if (new_data.password) {
                hashed_pass = await hash_password(new_data.password)
            }
            let roles = undefined
            if(new_data.roles) {
                // Ensuring integrity, by removing duplocates and having Normal role as a must.
                roles = new Set<RoleEnumType>(new_data.roles as RoleEnumType[])
                roles.add(RoleEnum.NORMAL)
                roles = [...roles]
            }

            let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
            await UserModel.updateOne( filter_q, { $set: {username: new_data.username, password: hashed_pass, roles: roles }})

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
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
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Banned User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.MANAGMENT, OP.WRITE),
                create_permission(RoleEnum.DBA, OP.WRITE),
                create_permission(RoleEnum.ANALYTICS, OP.WRITE),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let id = c.req.param("id")

            let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
            // Use the $addToSet operator instead of $push to prevent duplicates from being added to the array. 
            await UserModel.updateOne( filter_q, { $addToSet: { roles: RoleEnum.BANNED }} )

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
            logger.error({error: e}, "Error in PUT /users/:id")
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
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Delete Current User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.NORMAL, OP.WRITE),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let user = payload["user"] as any
            let id = user.id

            let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
            await UserModel.deleteOne( filter_q)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)
            
        } catch(e) {
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
           ...get_described_route(HttpStatusCode.NO_CONTENT, "Delete User", one_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "User's not found", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    auth_header_validator(),
    id_param_validator(),
    async(c) => {
        try {
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let authorized_list = [
                create_permission(RoleEnum.MANAGMENT, OP.WRITE),
                create_permission(RoleEnum.DBA, OP.WRITE),
                create_permission(RoleEnum.ANALYTICS, OP.WRITE),
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let id = c.req.param("id")

            let filter_q: QueryFilter<typeof UserModel> = { _id: new Types.UUID(id) }
            await UserModel.deleteOne( filter_q)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
            logger.error({error: e}, "Error in DELETE /users/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)
