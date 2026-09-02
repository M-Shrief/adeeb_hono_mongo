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
import { uuid_schema, reviewed_schema, created_at, updated_at } from '../../schemas/general.js';
import { name_schema, time_period_schema, bio_schema} from "../../schemas/adeeb.js"
import { minimal_schema as poems_schema } from "../../schemas/poem.js"
import { minimal_schema as chosen_verses_schema } from "../../schemas/chosen_verse.js"
import { minimal_schema as prose_qoutes_schema } from "../../schemas/prose_qoute.js"
import { create_many_schema } from '../../schemas/api.js';


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
export const create_many_res = create_many_schema(create_one_res)

export const update_req = object({
  name: optional(name_schema),
  time_period: optional(time_period_schema),
  bio: optional(bio_schema),
  reviewed: optional(reviewed_schema),
});
