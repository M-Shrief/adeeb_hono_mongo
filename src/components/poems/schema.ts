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
// utils
import { uuid_schema, verses_schema, is_couplet_schema, reviewed_schema,  created_at, updated_at } from '../../utils/schemas.js';


const intro_schema = pipe(string(), trim(), minLength(4), maxLength(256));


export const one_schema = object({
  id: uuid_schema,
  adeeb: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema
})

export const create_one_req = object({
  adeeb: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema
});

export const create_one_res = object({
  id: uuid_schema,
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
