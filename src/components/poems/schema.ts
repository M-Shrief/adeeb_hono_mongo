import {
  pipe,
  optional,
  array,
  object,
  string,
  trim,
  maxLength,
  minLength,
  number,
} from 'valibot';
/////////////
import { uuid_schema, verses_schema, is_couplet_schema, reviewed_schema,  created_at, updated_at } from '../../schemas/general.js';
import { intro_schema } from "../../schemas/poem.js"
import { minimal_schema as adeeb_schema } from "../../schemas/adeeb.js"
import { minimal_schema as chosen_verses_schema } from "../chosen_verses/schema.js"



export const get_one_res = object({
  _id: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,
  adeeb: adeeb_schema,
  chosen_verses: array(chosen_verses_schema)
})

export const create_one_req = object({
  adeeb: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema
});

export const create_one_res = object({
  _id: uuid_schema,
  adeeb: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
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
  adeeb: optional(uuid_schema),
  intro: optional(intro_schema),
  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  reviewed: optional(reviewed_schema)
});
