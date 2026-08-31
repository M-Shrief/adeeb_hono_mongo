import {
  pipe,
  optional,
  array,
  object,
  number,
} from 'valibot';
/////////////
import { uuid_schema, tags_schema, reviewed_schema, created_at, updated_at, verses_schema, is_couplet_schema } from '../../schemas/general.js';
import { minimal_schema as adeeb_schema } from "../../schemas/adeeb.js"
import { minimal_schema as poem_schema } from "../../schemas/poem.js"


export const get_one_res = object({
  _id: uuid_schema,
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb: adeeb_schema,
  poem: poem_schema,
})


export const create_one_req = object({
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb: uuid_schema,
  poem: uuid_schema,
});

export const create_one_res = object({
  _id: uuid_schema,
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb: uuid_schema,
  poem: uuid_schema,

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
  tags: optional(tags_schema),
  verses: optional(verses_schema),
  is_couplet: optional(is_couplet_schema),
  reviewed: optional(reviewed_schema),

  adeeb: optional(uuid_schema),
  poem: optional(uuid_schema),
});
