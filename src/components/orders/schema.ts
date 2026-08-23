import {
  pipe,
  optional,
  array,
  object,
  string,
  trim,
  enum as enum_schema,
  maxLength,
  minLength,
  boolean,
  date,
  number
} from 'valibot';
/////////////
import { OrderStatusEnum, OutfitTypeEnum } from "../../database/schemas.js"
// utils
import { uuid_schema, verses_schema, is_couplet_schema, qoute_schema, reviewed_schema, created_at, updated_at } from '../../utils/schemas.js';


// Prints ////////////////////////

const font_type_schema = pipe(string(), trim(), maxLength(64));
const font_color_schema = pipe(string(), trim(), maxLength(64));
const outfit_type_schema = enum_schema(OutfitTypeEnum);
const outfit_color_schema = pipe(string(), trim(), maxLength(64));


export const one_print_schema = object({
  _id: uuid_schema,

  font_type: font_type_schema,
  font_color: font_color_schema,
  outfit_type: outfit_type_schema,
  outfit_color: outfit_color_schema,

  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  qoute: optional(qoute_schema),

  user: optional(uuid_schema),
  order: optional(uuid_schema),
  poem: optional(uuid_schema),
  chosen_verses: optional(uuid_schema),
  prose_qoute: optional(uuid_schema),
})

export const create_print_req = object({
  font_type: font_type_schema,
  font_color: font_color_schema,
  outfit_type: outfit_type_schema,
  outfit_color: outfit_color_schema,

  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  qoute: optional(qoute_schema),

  poem: optional(uuid_schema),
  chosen_verses: optional(uuid_schema),
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
  chosen_verses: optional(uuid_schema),
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
  chosen_verses: optional(uuid_schema),
  prose_qoute: optional(uuid_schema),
})


// Orders /////////////////////
const name_schema = pipe(string(), trim(), minLength(4), maxLength(128));
const phone_schema = pipe(string(), trim(), minLength(4), maxLength(128));
const address_schema = pipe(string(), trim(), minLength(4), maxLength(256));
const delivery_schedule = date()
const is_updateable = boolean()
const status_schema = enum_schema(OrderStatusEnum);


export const one_order_schema = object({
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
export const create_many_orders_res = object({
  created_items: array(create_order_res),
  success_count: number(),
  failed_count: number(),
})

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
