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
} from 'valibot';
/////////////
import { OrderStatusEnum } from "../database/schemas.js"
import { uuid_schema, reviewed_schema } from './general.js';
import { minimal_schema as minimal_print_schema } from './print.js';



export const name_schema = pipe(string(), trim(), minLength(4), maxLength(128));
export const phone_schema = pipe(string(), trim(), minLength(4), maxLength(128));
export const address_schema = pipe(string(), trim(), minLength(4), maxLength(256));
export const delivery_schedule = date()
export const is_updateable = boolean()
export const status_schema = enum_schema(OrderStatusEnum);


export const one_schema = object({
  _id: uuid_schema,
  user: optional(uuid_schema),
  name: name_schema,
  phone: phone_schema,
  address: address_schema,
  delivery_schedule: delivery_schedule,
  is_updateable: is_updateable,
  status: status_schema,
  reviewed: reviewed_schema,
  prints: array(minimal_print_schema)
})

