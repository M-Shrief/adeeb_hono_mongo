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
/////
import { uuid_schema, verses_schema, is_couplet_schema, reviewed_schema } from '../schemas/general.js';

export const intro_schema = pipe(string(), trim(), minLength(4), maxLength(256));


export const one_schema = object({
  _id: uuid_schema,
  adeeb: uuid_schema,
  intro: intro_schema,
  verses: verses_schema,
  is_couplet: is_couplet_schema,
  reviewed: reviewed_schema
})

export const minimal_schema = object({
  _id: uuid_schema,
  intro: intro_schema,
})
