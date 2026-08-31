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
import { TimePeriodEnum } from "../database/schemas.js"
import { uuid_schema, reviewed_schema} from '../schemas/general.js';


export const name_schema = pipe(string(), trim(), minLength(4), maxLength(256));

export const time_period_schema = enum_schema(TimePeriodEnum);

export const bio_schema = pipe(string(), trim(), minLength(4), maxLength(1024));


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
