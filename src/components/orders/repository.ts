import { QueryFilter, Types } from 'mongoose';
////
import { OrderStatusEnum, RoleEnum, OrderModel, PrintModel } from "../../database/schemas.js"
import { logger } from '../../utils/logger.js';
import { cache_del, cache_get, cache_set, format_key_by_id } from "../../cache/utils.js"
import { APIError } from '../..//utils/errors.js'
import { HttpStatusCode } from '../../utils/api.js';
import { InvalidItemType } from '../../schemas/api.js';
import { Order } from './types.js';

const cache_prefix = "orders" 

const get_all = async (limit: number, offset: number) => {
    try {
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
                        $unset: ["order", "user", "__v"],
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

        return {
            data: orders,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /orders")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const get_user_orders = async (user_id: string, limit: number, offset: number) => {
    try {
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
                        $unset: ["order", "user", "__v"],
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

        return {
            data: orders,
            limit, 
            offset, 
            total_count: total_count
        }
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in GET /orders/me")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}


const get_one_by_id = async (id: string) => {
    try {
        let cache_key = format_key_by_id(cache_prefix, id)
        let cache_res = await cache_get(cache_key)

        if(cache_res) {
            return cache_res as Order
        }
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
                        $unset: ["order", "user", "__v"],
                    },
                ],
                },
            },
        ]);

        let order: Order = result.length != 0 ? result[0] : null
        if (!order) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        await cache_set(cache_key, order)
        return order
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        } else {
            logger.error({error:e}, "Error in GET /orders/:id")
            throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
        }
    }
}

const check_order = async(order_id: string) => {
    try {
        let existing_order = await OrderModel.findById(order_id, {
            id: 1,
            user: 1,
            is_updateable: 1,
        })

        if (!existing_order) {
            throw new APIError(HttpStatusCode.NOT_FOUND, "repository")
        }
        return existing_order
    } catch(e) {
        if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in checking order existence")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_order = async(data: any) => {
    try {
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

        return {...new_order._doc, prints: new_prints}
    } catch(e: any) {
       if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
         if(e instanceof APIError) {
            throw e
        }
        logger.error({error:e}, "Error in POST /orders")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_orders = async(data: any[]) => {
    try {
        let new_orders: any[] = []
        let invalid_items: InvalidItemType[] = []
        let delivery_schedule = new Date()
        delivery_schedule.setDate(delivery_schedule.getDate() + 7);
        for (let [index, order] of data.entries()) {
            let new_order: any
            try{
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
                new_order = await OrderModel.create({...order_data as any })                    
            } catch(e: any) {
                if (e.name === "ValidationError") {
                    invalid_items.push({item_index: index, message: e.message})
                    continue
                }
                let msg: string = "Error inserting Order, try again later"
                invalid_items.push({item_index: index, message: msg})
                continue
            }
            let prints_data = order.prints.map((item: any) => { return {...item, user: new_order.get("user"), order: new_order.get("_id")}})
            let new_prints = await PrintModel.create([...prints_data])

            // We specifiy new_order._doc field to get the created records values, without it's metadata
            new_orders.push({...new_order._doc, prints: new_prints})
        }


        return {created_items: new_orders, success_count: new_orders.length, invalid_items}
    } catch(e) {
        logger.error({error:e}, "Error in POST /orders/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_print = async(order_id: string, user_id: string | null, data: any) => {
    try {
        let print_data = {...data, user: user_id, order: order_id}
        let new_print = await PrintModel.create({...print_data})

        return new_print
    } catch(e: any) {
       if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error:e}, "Error in POST /orders/{id}/prints")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const create_prints = async(order_id: string, user_id: string | null, data: any[]) => {
    try {
        let new_prints: any[] = []
        let invalid_items: InvalidItemType[] = []
        for (let [index, print] of data.entries()) {
            let new_print: any
            try{
                let print_data = {...print, user: user_id, order: order_id}
                new_print = await PrintModel.create({...print_data})
            } catch(e: any) {
                if (e.name === "ValidationError") {
                    invalid_items.push({item_index: index, message: e.message})
                    continue
                }
                let msg: string = "Error inserting Order, try again later"
                invalid_items.push({item_index: index, message: msg})
                continue
            }

            new_prints.push(new_print)
        }
        return {created_items: new_prints, success_count: new_prints.length, invalid_items}

    } catch(e) {
        logger.error({error:e}, "Error in POST /orders/{id}/prints/many")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const update_order = async(id: string, data: any) => {
    try {        
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

        return null
    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error: e}, "Error in PUT /orders/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const update_print = async(order_id: string, print_id: string, data: any) => {
    try {
        await PrintModel.updateOne( {_id: new Types.UUID(print_id)}, { $set: { ...data} })

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, order_id)
        await cache_del(cache_key)

    } catch(e: any) {
        if (e.name === "ValidationError") {
            throw new APIError(HttpStatusCode.UNPROCESSABLE_ENTITY, "repository", e.message)
        }
        logger.error({error: e}, "Error in PUT /orders/:id/prints/{id}")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}

const delete_order = async(id: string) => {
    try {        
        await PrintModel.deleteMany({ order: new Types.UUID(id) })
        let filter_q: QueryFilter<typeof OrderModel> = { _id: new Types.UUID(id) }
        await OrderModel.deleteOne( filter_q)

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, id)
        await cache_del(cache_key)
        return null
    } catch(e: any) {
        logger.error({error: e}, "Error Delete /orders/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    

const delete_print = async(order_id: string, print_id: string) => {
    try {        
        await PrintModel.deleteOne({ _id: new Types.UUID(print_id) })

        // Delete from cache after update to prevent showing old data
        let cache_key = format_key_by_id(cache_prefix, order_id)
        await cache_del(cache_key)
        return null
    } catch(e: any) {
        logger.error({error: e}, "Error Delete /orders/:id")
        throw new APIError(HttpStatusCode.BAD_REQUEST, "repository")
    }
}    


export const repository = {
    get_all,
    get_user_orders,
    get_one_by_id,
    check_order,
    create_order,
    create_orders,
    create_print,
    create_prints,
    update_order,
    update_print,
    delete_order,
    delete_print,
}
