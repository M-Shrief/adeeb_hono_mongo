import {
  optional,
  array,
  object,
  number,
} from 'valibot';
/////////////
import {source_schema} from "../../schemas/prose_qoute.js"
import { uuid_schema, qoute_schema, tags_schema, reviewed_schema, created_at, updated_at } from '../../schemas/general.js';
import { minimal_schema as adeeb_schema } from "../../schemas/adeeb.js"

export const get_one_res = object({
  qoute: qoute_schema,
  source: optional(source_schema),
  tags: tags_schema,
  reviewed: reviewed_schema,

  adeeb: adeeb_schema,
});

export const create_one_req = object({
  qoute: qoute_schema,
  source: optional(source_schema),
  tags: tags_schema,
  reviewed: reviewed_schema,

  adeeb: uuid_schema,
});

export const create_one_res = object({
  _id: uuid_schema,
  qoute: qoute_schema,
  source: optional(source_schema),
  tags: tags_schema,
  reviewed: reviewed_schema,

  adeeb: uuid_schema,

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
  qoute: optional(qoute_schema),
  source: optional(source_schema),
  tags: optional(tags_schema),
  reviewed: optional(reviewed_schema),

  adeeb: optional(uuid_schema),
});
