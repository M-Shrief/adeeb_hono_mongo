import {
  object,
} from 'valibot';
/////////////
import { uuid_schema, tags_schema, reviewed_schema, verses_schema, is_couplet_schema } from './general.js';


export const one_schema = object({
  _id: uuid_schema,
  tags: tags_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema,

  adeeb: uuid_schema,
  poem: uuid_schema,
})

export const minimal_schema = object({
  _id: uuid_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
})
