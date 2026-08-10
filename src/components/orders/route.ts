import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { sql, getTableColumns, eq } from 'drizzle-orm';
/////
import { db } from "../../database/index.js"
import { OrderStatusEnum, RoleEnum, order_table, prints_table } from "../../database/schemas.js"
import { one_order_schema, create_order_req, create_order_res, create_many_orders_req, create_many_orders_res, create_print_res, create_print_req, update_order_req, update_print_req} from './schema.js'
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
///// Utils
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, param_validator, query_validator } from '../../utils/validators.js'
import { HttpStatusCode, base_response_schema, queries_schema_for_get_all_req, get_described_route, get_all_schema, describe_jwt_security} from '../../utils/api.js';
import { verify_token, create_permission, OP, check_permission, check_if_adminstrator, check_ownership} from "../../utils/auth.js"
import { object } from 'valibot';
import { uuid_schema } from '../../utils/schemas.js';


export const orders_route = new Hono() 

const cache_prefix = "orders" 

orders_route.get(
    "/orders",
    describeRoute({
        tags: ["Orders"],
        summary: "Get All",
        ...describe_jwt_security,
        responses: {
           ...get_described_route(HttpStatusCode.OK, "Get All Orders", get_all_schema(one_order_schema)),
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

            let is_authorized = check_if_adminstrator(permissions, OP.READ)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }
            
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

            let [orders, counts] = await Promise.all([
                await db.query.order_table.findMany({
                    columns: {
                        created_at: false,
                        updated_at: false,
                    },
                    with: {
                        prints: {
                            columns: {
                                // already got them in order
                                user_id: false, 
                                order_id: false
                            }
                        }
                    },
                    limit: limit,
                    offset: offset,
                }),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(order_table)
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: orders,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )        

        } catch(e) {
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
           ...get_described_route(HttpStatusCode.OK, "Get All Orders", get_all_schema(one_order_schema)),
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
                create_permission(RoleEnum.NORMAL, OP.READ)
            ]
            
            let is_authorized = check_permission(authorized_list, permissions, OP.READ)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let user: any = payload["user"]
            let user_id: string = user["id"]
            
            let limit = Number(c.req.query('limit')) || 100
            let offset = Number(c.req.query('offset')) || 0

            let [orders, counts] = await Promise.all([
                await db.query.order_table.findMany({
                    columns: {
                        created_at: false,
                        updated_at: false,
                    },
                    with: {
                        prints: {
                            columns: {
                                // already got them in order's data
                                user_id: false, 
                                order_id: false
                            }
                        }
                    },
                    limit: limit,
                    offset: offset,
                    where: (order_table, { eq }) => eq(order_table.user_id, user_id),
                }),
                await db.select({total_count: sql<number>`count(*) OVER()`.mapWith(Number)}).from(order_table).where(eq(order_table.user_id, user_id))
            ])
            
            let total_count = counts[0] ? counts[0].total_count : 0 

            return c.json(
                {
                    data: orders,
                    limit, 
                    offset, 
                    total_count: total_count
                },
                HttpStatusCode.OK
            )        

        } catch(e) {
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
           ...get_described_route(HttpStatusCode.OK, "Get Order", one_order_schema),
           ...get_described_route(HttpStatusCode.UNAUTHORIZED, "Not Authorized", base_response_schema),
           ...get_described_route(HttpStatusCode.NOT_FOUND, "NOT FOUND", base_response_schema),
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

            let id = c.req.param("id")
            let cache_key = format_key_by_id(cache_prefix, id)
            let cache_res = await cache_get(cache_key)
            let order: any
        
            if(cache_res) {
                order = cache_res
            } else {
                order = await db.query.order_table.findFirst({
                        columns: {
                            created_at: false,
                            updated_at: false,
                        },
                        with: {
                            prints: {
                                columns: {
                                    // already got them in order
                                    user_id: false, 
                                    order_id: false
                                }
                            }
                        },
                        where: (order_table, { eq }) => eq(order_table.id, id),
                    })
            }

            if (!order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            let permissions = payload["permissions"] as string[]
            let is_authorized = check_if_adminstrator(permissions, OP.READ)
            if (!is_authorized) {
                if (check_ownership(order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }            
    
            return c.json(order,HttpStatusCode.OK)        
        } catch(e) {
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
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Order", create_order_req),
           ...get_described_route(HttpStatusCode.UNPROCESSABLE_ENTITY, "Invalid data for order", base_response_schema),
           ...get_described_route(HttpStatusCode.BAD_REQUEST, "Bad Request", base_response_schema),
        },
    }),
    json_validator(create_order_req, "Invalid data for Order"),
    async(c) => {
        try {
            let data = await c.req.json()
            let delivery_schedule = new Date()
            delivery_schedule.setDate(delivery_schedule.getDate() + 7);

            let new_order = await db
                .insert(order_table)
                .values({ 
                    name: data.name,
                    phone: data.phone,
                    address: data.address,
                    reviewed: false,
                    is_updateable: true,
                    delivery_schedule: delivery_schedule,
                    status: OrderStatusEnum.IN_PROGRESS,
                    user_id: data.user_id
                })
                // .onConflictDoNothing()
                .returning()
                .then(res => res[0])

            let prints_data = data.prints.map((item: any) => { return {...item, user_id: new_order.user_id, order_id: new_order.id}})
            let new_prints = await db
                .insert(prints_table)
                .values([...prints_data])
                .onConflictDoNothing()
                .returning()


            return c.json({...new_order, prints: new_prints}, HttpStatusCode.CREATED)


        } catch(e) {
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let permissions = payload["permissions"] as string[]
            let is_authorized = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_authorized) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }


            let data = await c.req.json()
            let delivery_schedule = new Date()
            delivery_schedule.setDate(delivery_schedule.getDate() + 7);

            let new_orders: any[] = []
            for (let order of data as any[]) {
                let new_order = await db
                    .insert(order_table)
                    .values({ 
                        name: order.name,
                        phone: order.phone,
                        address: order.address,
                        reviewed: false,
                        is_updateable: true,
                        delivery_schedule: delivery_schedule,
                        status: OrderStatusEnum.IN_PROGRESS,
                        user_id: order.user_id
                    })
                    // .onConflictDoNothing()
                    .returning()
                    .then(res => res[0])

                let prints_data = order.prints.map((item: any) => { return {...item, user_id: new_order.user_id, order_id: new_order.id}})
                let new_prints = await db
                    .insert(prints_table)
                    .values([...prints_data])
                    .onConflictDoNothing()
                    .returning()

                new_orders.push({...new_order, prints: new_prints})
            }


            return c.json(
                {
                    created_items: new_orders,
                    success_count: new_orders.length,
                    failed_count: data.length - new_orders.length
                },
                HttpStatusCode.CREATED
            )

        } catch(e) {
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
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Prints", create_print_res),
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let order_id = c.req.param("order_id")
            let existing_order = await db.query.order_table.findFirst({
                columns: {
                    id: true,
                    user_id: true,
                    is_updateable: true,
                },
                where: (order_table, { eq }) => eq(order_table.id, order_id),
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            let user: any = payload["user"]
            let user_id: string = user["id"]
            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                if (check_ownership(existing_order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.is_updateable) { 
                    return c.json({ message: "Not Authorized to update order's data"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let data = await c.req.json()
            let print_data = {...data, user_id: user_id, order_id: order_id}
            let new_print = await db
                .insert(prints_table)
                .values(print_data)
                .onConflictDoNothing()
                .returning()

            return c.json(new_print, HttpStatusCode.CREATED)

        } catch(e) {
            logger.error({error:e}, "Error in POST /orders/:order_id/prints")
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let id = c.req.param("id")
            let existing_order = await db.query.order_table.findFirst({
                columns: {
                    id: true,
                    user_id: true,
                    is_updateable: true,
                },
                where: (order_table, { eq }) => eq(order_table.id, id),
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }
            let data = await c.req.json()

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                if (check_ownership(existing_order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.is_updateable) {
                    return c.json({ message: "Not Authorized to update order's data"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's updated by the owner, then remove admin's related fields -- aka assign them to undefine.
                data.is_updateable = undefined
                data.status = undefined
                data.reviewed = undefined
                data.user_id = undefined
            }

            // Ensuring data integrity

            // If the order is aborted or marked as completed, then we make sure that is_updateable is False
            if (data.status == OrderStatusEnum.COMPLETED || data.status == OrderStatusEnum.ABORTED) {
                data.is_updateable = false
            } else if (data.status == OrderStatusEnum.IN_PROGRESS) {
                data.is_updateable = true
            } else if (data.is_updateable) { 
            // if it want to make is_updateable true, then we make sure status == "in progress".
                data.status = OrderStatusEnum.IN_PROGRESS
            }

            await db.update(order_table).set({...data, updated_at: sql`NOW()`}).where(eq(order_table.id, id))

            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)
 

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)

        } catch(e) {
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let order_id = c.req.param("order_id")
            let existing_order = await db.query.order_table.findFirst({
                columns: {
                    id: true,
                    user_id: true,
                    is_updateable: true,
                },
                where: (order_table, { eq }) => eq(order_table.id, order_id),
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }
            let data = await c.req.json()

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                if (check_ownership(existing_order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.is_updateable) {
                    return c.json({ message: "Not Authorized to update print's data"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let print_id = c.req.param("print_id")
            await db.update(prints_table).set({...data, updated_at: sql`NOW()`}).where(eq(prints_table.id, print_id))

            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, order_id)
            await cache_del(cache_key)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)

        } catch(e) {
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let order_id = c.req.param("id")
            let existing_order = await db.query.order_table.findFirst({
                columns: {
                    id: true,
                    user_id: true,
                    is_updateable: true,
                },
                where: (order_table, { eq }) => eq(order_table.id, order_id),
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }


            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                if (check_ownership(existing_order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can delete it or not
                if (!existing_order.is_updateable) {
                    return c.json({ message: "Not Authorized to delete print"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }

            let id = c.req.param("id")
            await db.delete(prints_table).where(eq(prints_table.order_id, id))
            await db.delete(order_table).where(eq(order_table.id, id))

            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, id)
            await cache_del(cache_key)


            return c.newResponse(null, HttpStatusCode.NO_CONTENT)

        } catch(e) {
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
            let auth_header = c.req.header("Authorization")
            let payload = await verify_token(auth_header!) // header was already validated
            if (!payload) {
                return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
            }

            let order_id = c.req.param("order_id")
            let existing_order = await db.query.order_table.findFirst({
                columns: {
                    id: true,
                    user_id: true,
                    is_updateable: true,
                },
                where: (order_table, { eq }) => eq(order_table.id, order_id),
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                if (check_ownership(existing_order.user_id, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can delete it or not
                if (!existing_order.is_updateable) {
                    return c.json({ message: "Not Authorized to delete print"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let print_id = c.req.param("print_id")
            await db.delete(prints_table).where(eq(prints_table.id, print_id))

            // Delete from cache after update to prevent showing old data
            let cache_key = format_key_by_id(cache_prefix, order_id)
            await cache_del(cache_key)

            return c.newResponse(null, HttpStatusCode.NO_CONTENT)

        } catch(e) {
            logger.error({error:e}, "Error in DELETE /orders/:order_id/prints/:print_id")
            return c.json({message: "Unknown error, try again later"}, HttpStatusCode.BAD_REQUEST)
        }
    }
)
