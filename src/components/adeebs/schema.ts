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
  number,
} from 'valibot';
/////////////
import { TimePeriodEnum } from "../../database/schemas.js"
import { minimal_schema as poems_schema } from "../poems/schema.js"
import { minimal_schema as chosen_verses_schema } from "../chosen_verses/schema.js"
import { minimal_schema as prose_qoutes_schema } from "../prose_qoutes/schema.js"
import { uuid_schema, reviewed_schema, created_at, updated_at } from '../../schemas/general.js';


const name_schema = pipe(string(), trim(), minLength(4), maxLength(256));

const time_period_schema = enum_schema(TimePeriodEnum);

const bio_schema = pipe(string(), trim(), minLength(4), maxLength(1024));


export const one_schema = object({
  _id: uuid_schema,
  name: name_schema,
  time_period: time_period_schema,
  bio: bio_schema,
  reviewed: reviewed_schema
})

export const minimal_schema = object({
  _id: uuid_schema,
  name: name_schema,
})

export const get_one_res = object({
  _id: uuid_schema,
  name: name_schema,
  time_period: time_period_schema,
  bio: bio_schema,
  reviewed: reviewed_schema,
  poems: array(poems_schema),
  chosen_verses: array(chosen_verses_schema),
  prose_qoutes: array(prose_qoutes_schema)
})

export const create_one_req = object({
  name: name_schema,
  time_period: time_period_schema,
  bio: bio_schema,
  reviewed: reviewed_schema,
});

export const create_one_res = object({
  _id: uuid_schema,
  name: name_schema,
  time_period: time_period_schema,
  bio: bio_schema,
  reviewed: reviewed_schema,
  created_at, 
  updated_at,
});

export const create_many_req = array(create_one_req)
export const create_many_res = object({
  created_items: array(create_one_res),
  success_count: number(),
  failed_count: number(),
})

export const update_req = object({
  name: optional(name_schema),
  time_period: optional(time_period_schema),
  bio: optional(bio_schema),
  reviewed: optional(reviewed_schema),
});
