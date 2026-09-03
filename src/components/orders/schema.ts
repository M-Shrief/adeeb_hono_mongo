import {
  optional,
  array,
  object,
  number
} from 'valibot';
/////////////
import { uuid_schema, verses_schema, is_couplet_schema, qoute_schema, reviewed_schema, created_at, updated_at } from '../../schemas/general.js';
import { font_color_schema, font_type_schema, outfit_type_schema, outfit_color_schema } from '../../schemas/print.js';
import { address_schema, delivery_schedule, is_updateable, name_schema, phone_schema, status_schema } from '../../schemas/order.js';
import { create_many_schema } from '../../schemas/api.js';



export const create_print_req = object({
  font_type: font_type_schema,
  font_color: font_color_schema,
  outfit_type: outfit_type_schema,
  outfit_color: outfit_color_schema,

  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  qoute: optional(qoute_schema),

  poem: optional(uuid_schema),
  chosen_verse: optional(uuid_schema),
  prose_qoute: optional(uuid_schema),
})


export const create_print_res = object({
  _id: uuid_schema,

  font_type: font_type_schema,
  font_color: font_color_schema,
  outfit_type: outfit_type_schema,
  outfit_color: outfit_color_schema,

  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  qoute: optional(qoute_schema),

  poem: optional(uuid_schema),
  chosen_verse: optional(uuid_schema),
  prose_qoute: optional(uuid_schema),
})

export const update_print_req = object({
  order: optional(uuid_schema),
  user: optional(uuid_schema),

  font_type: optional(font_type_schema),
  font_color: optional(font_color_schema),
  outfit_type: optional(outfit_type_schema),
  outfit_color: optional(outfit_color_schema),

  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  qoute: optional(qoute_schema),

  poem: optional(uuid_schema),
  chosen_verse: optional(uuid_schema),
  prose_qoute: optional(uuid_schema),
})


// Orders /////////////////////

export const create_order_req = object({
  user: optional(uuid_schema),
  name: name_schema,
  phone: phone_schema,
  address: address_schema,
  prints: array(create_print_req)
})

export const create_order_res = object({
  _id: uuid_schema,
  user: optional(uuid_schema),
  name: name_schema,
  phone: phone_schema,
  address: address_schema,
  delivery_schedule: delivery_schedule,
  is_updateable: is_updateable,
  status: status_schema,
  reviewed: reviewed_schema,
  prints: array(create_print_res)
})

export const create_many_orders_req = array(create_order_req)
export const create_many_orders_res = create_many_schema(create_order_res)

export const update_order_req = object({
  user: optional(uuid_schema),
  name: optional(name_schema),
  phone: optional(phone_schema),
  address: optional(address_schema),
  delivery_schedule: optional(delivery_schedule),
  is_updateable: optional(is_updateable),
  status: optional(status_schema),
  reviewed: optional(reviewed_schema),
  prints: optional(array(create_print_req))
})
