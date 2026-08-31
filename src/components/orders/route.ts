import { Hono } from 'hono';
import {
  describeRoute,
} from "hono-openapi";
import { QueryFilter, Types } from 'mongoose';
/////
import { OrderStatusEnum, RoleEnum, OrderModel, PrintModel } from "../../database/schemas.js"
import { one_order_schema, create_order_req, create_order_res, create_many_orders_req, create_many_orders_res, create_print_res, create_print_req, update_order_req, update_print_req} from './schema.js'
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
///// Utils
import { logger } from '../../utils/logger.js';
import { auth_header_validator, id_param_validator, json_validator, param_validator, query_validator } from '../../utils/validators.js'
import { base_response_schema, queries_schema_for_get_all_req, get_all_schema} from '../../schemas/api.js';
import { HttpStatusCode, get_described_route, describe_jwt_security } from '../../utils/api.js';
import { verify_token, create_permission, OP, check_permission, check_if_adminstrator, check_ownership} from "../../utils/auth.js"
import { object } from 'valibot';
import { uuid_schema } from '../../schemas/general.js';


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


            const result = await OrderModel.aggregate([
                {
                    $unset: ['created_at', 'updated_at', '__v'],
                },
                {
                    $lookup: {
                    from: 'prints',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'prints',
                    pipeline: [
                        {
                            $unset: ["order", "user"],
                        },
                    ],
                    },
                },
                {
                    $facet: {
                        data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                        count: [ { $count: 'total_count' } ]          // Get count
                    }
                }
            ]);

            const orders = result[0].data;
            const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

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

            const result = await OrderModel.aggregate([
                {
                    $match: { user: new Types.UUID(user_id) },
                },
                {
                    $unset: ['created_at', 'updated_at', '__v'],
                },
                {
                    $lookup: {
                    from: 'prints',
                    localField: '_id',
                    foreignField: 'order',
                    as: 'prints',
                    pipeline: [
                        {
                            $unset: ["order", "user"],
                        },
                    ],
                    },
                },
                {
                    $facet: {
                        data: [ { $skip: offset }, { $limit: limit } ], // Get documents
                        count: [ { $count: 'total_count' } ]          // Get count
                    }
                }
            ]);
            const orders = result[0].data;
            const total_count = result[0].count[0] ? result[0].count[0].total_count : 0; 

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
                const result = await OrderModel.aggregate([
                    {
                        $match: { _id: new Types.UUID(id) },
                    },
                    {
                        $unset: ['created_at', 'updated_at', '__v'],
                    },
                    {
                        $lookup: {
                        from: 'prints',
                        localField: '_id',
                        foreignField: 'order',
                        as: 'prints',
                        pipeline: [
                            {
                                $unset: ["order", "user"],
                            },
                        ],
                        },
                    },
                ]);

                order = result.length != 0 ? result[0] : null
            }

            await cache_set(cache_key, order)

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
           ...get_described_route(HttpStatusCode.CREATED, "Successful added Order", create_order_res),
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
            let order_data = { 
                name: data.name,
                phone: data.phone,
                address: data.address,
                reviewed: false,
                is_updateable: true,
                delivery_schedule: delivery_schedule,
                status: OrderStatusEnum.IN_PROGRESS,
                user: data.user
            }
            let new_order = await OrderModel.create({...order_data as any })

            let prints_data = data.prints.map((item: any) => { return {...item, user: new_order.get("user"), order: new_order.get("_id")}})
            let new_prints = await PrintModel.create([...prints_data])

            // We specifiy new_order._doc field to get the created records values, without it's metadata
            return c.json({...new_order._doc, prints: new_prints}, HttpStatusCode.CREATED)


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
                let order_data = { 
                    name: order.name,
                    phone: order.phone,
                    address: order.address,
                    reviewed: false,
                    is_updateable: true,
                    delivery_schedule: delivery_schedule,
                    status: OrderStatusEnum.IN_PROGRESS,
                    user: order.user
                }
                let new_order = await OrderModel.create({...order_data as any })

                let prints_data = order.prints.map((item: any) => { return {...item, user: new_order.get("user"), order: new_order.get("_id")}})
                let new_prints = await PrintModel.create([...prints_data])

                // We specifiy new_order._doc field to get the created records values, without it's metadata
                new_orders.push({...new_order._doc, prints: new_prints})
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

            const existing_order = await OrderModel.findById(order_id, {
                _id: 1,
                user: 1,
                is_updateable: 1
            })
            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            let user: any = payload["user"]
            let user_id: string = user["id"]
            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                let order_user = existing_order.get("user") 
                let val =  order_user == null || order_user == undefined  ? null : order_user.toString()
                if (check_ownership(val, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.get("is_updateable")) { 
                    return c.json({ message: "Not Authorized to update order's data"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let data = await c.req.json()
            let print_data = {...data, user: user_id, order: order_id}
            let new_print = await PrintModel.create({...print_data})

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
            const existing_order = await OrderModel.findById(id, {
                _id: 1,
                user: 1,
                is_updateable: 1
            })
            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }
            let data = await c.req.json()

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                let order_user = existing_order.get("user") 
                let val =  order_user == null || order_user == undefined  ? null : order_user.toString()
                if (check_ownership(val, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.get("is_updateable")) {
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

            let filter_q: QueryFilter<typeof OrderModel> = { _id: new Types.UUID(id) }
            await OrderModel.updateOne( filter_q, { $set: { ...data} })

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
            const existing_order = await OrderModel.findById(order_id, {
                _id: 1,
                user: 1,
                is_updateable: 1
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }
            let data = await c.req.json()

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                let order_user = existing_order.get("user") 
                let val =  order_user == null || order_user == undefined  ? null : order_user.toString()
                if (check_ownership(val, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can update it or not
                if (!existing_order.get("is_updateable")) {
                    return c.json({ message: "Not Authorized to update print's data"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let print_id = c.req.param("print_id")
            
            await PrintModel.updateOne( {_id: new Types.UUID(print_id)}, { $set: { ...data} })

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
            const existing_order = await OrderModel.findById(order_id, {
                _id: 1,
                user: 1,
                is_updateable: 1
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }


            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                let order_user = existing_order.get("user") 
                let val =  order_user == null || order_user == undefined  ? null : order_user.toString()
                if (check_ownership(val, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can delete it or not
                if (!existing_order.get("is_updateable")) {
                    return c.json({ message: "Not Authorized to delete print"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }

            let id = c.req.param("id")
            await PrintModel.deleteMany({ order: new Types.UUID(id) })
            let filter_q: QueryFilter<typeof OrderModel> = { _id: new Types.UUID(id) }
            await OrderModel.deleteOne( filter_q)

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
            const existing_order = await OrderModel.findById(order_id, {
                _id: 1,
                user: 1,
                is_updateable: 1
            })

            if (!existing_order) {
                return c.json({message: "Order's not Found"}, HttpStatusCode.NOT_FOUND)
            }

            let permissions = payload["permissions"] as string[]
            let is_adminstrator = check_if_adminstrator(permissions, OP.WRITE)
            if (!is_adminstrator) {
                let order_user = existing_order.get("user") 
                let val =  order_user == null || order_user == undefined  ? null : order_user.toString()
                if (check_ownership(val, payload) == false) {
                    return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
                }
                // if it's owner, we need to check if he can delete it or not
                if (!existing_order.get("is_updateable")) {
                    return c.json({ message: "Not Authorized to delete print"}, HttpStatusCode.UNAUTHORIZED) 
                }
            }


            let print_id = c.req.param("print_id")
            await PrintModel.deleteOne({ _id: new Types.UUID(print_id) })

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
