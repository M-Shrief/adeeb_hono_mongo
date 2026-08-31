import {
  pipe,
  optional,
  object,
  string,
  trim,
  enum as enum_schema,
  maxLength,
} from 'valibot';
/////////////
import { OutfitTypeEnum } from "../database/schemas.js"
import { uuid_schema, verses_schema, is_couplet_schema, qoute_schema } from './general.js';


export const font_type_schema = pipe(string(), trim(), maxLength(64));
export const font_color_schema = pipe(string(), trim(), maxLength(64));
export const outfit_type_schema = enum_schema(OutfitTypeEnum);
export const outfit_color_schema = pipe(string(), trim(), maxLength(64));


export const one_schema = object({
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

export const minimal_schema = object({
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
