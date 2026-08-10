import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { RoleEnum, user_table } from "../../database/schemas.js"
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

            let { id, username, roles} = getTableColumns(user_table) // select all columns, except created_at & updated_at.
            let [users, counts] = await Promise.all([
                await db.select({ id, username, roles }).from(user_table).limit(limit).offset(offset),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(user_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

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

            let existing_user = await db.query.user_table.findFirst({
                columns: {
                    id: true,
                    username: true,
                    roles: true,
                },
                where: (user_table, { eq }) => eq(user_table.id, id),
            })

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
        summary: "Get One",
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
            let existing_user = await db.query.user_table.findFirst({
                columns: {
                    id: true,
                    username: true,
                    roles: true,
                },
                where: (user_table, { eq }) => eq(user_table.id, id),
            })

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

            let new_user = await db
                .insert(user_table)
                .values({username: new_data.username, password: hashed_pass, roles: [...roles]})
                .onConflictDoNothing({ target: [user_table.username] })
                .returning()
                .then(res => res[0])
            if (!new_user) {
                return c.json({ message: "User already exists"}, HttpStatusCode.NOT_ACCEPTABLE) 
            }

            let access_token = await sign_token(new_user.id, new_user.username, new_user.roles)

            return c.json({user: {id: new_user.id, username: new_user.username, roles: new_user.roles}, access_token}, HttpStatusCode.CREATED)
        } catch(e) {
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

            let existing_user = await db.query.user_table.findFirst({
                columns: {
                    id: true,
                    username: true,
                    password: true,
                    roles: true,
                },
                where: (user_table, { eq }) => eq(user_table.username, login_data.username),
            })

            if (!existing_user) {
                return c.json({ message: "Username doesn't exist"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let pass_is_correct = await compare_password(login_data.password, existing_user.password)
            if (!pass_is_correct) {
                return c.json({ message: "Password isn't correct"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let access_token = await sign_token(existing_user.id, existing_user.username, existing_user.roles)

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

            // set() ignores fields with undefined value, so we don't need conditions
            let new_data = await c.req.json()
            let hashed_pass = undefined
            if (new_data.password) {
                hashed_pass = await hash_password(new_data.password)
            }
            await db.update(user_table).set({username: new_data.username, password: hashed_pass, updated_at: sql`NOW()`}).where(eq(user_table.id, id))

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
            await db.update(user_table).set({username: new_data.username, password: hashed_pass, roles: roles, updated_at: sql`NOW()`}).where(eq(user_table.id, id))

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

            await db.delete(user_table).where(eq(user_table.id, id))

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

            await db.delete(user_table).where(eq(user_table.id, id))

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)            
        } catch(e) {
            logger.error({error: e}, "Error in DELETE /users/:id")
            return c.json({message: "Bad Request, try again later."}, HttpStatusCode.BAD_REQUEST)
        }
    }    
)
