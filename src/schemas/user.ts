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
} from 'valibot';
/////////////
import { RoleEnum } from "../database/schemas.js"
// utils
import { uuid_schema } from './general.js';


export const username_schema = pipe(string(), trim(), minLength(4), maxLength(256));
export const password_schema = pipe(string(), trim(), minLength(4), maxLength(256));
export const roles_schema = array(enum_schema(RoleEnum));


export const one_schema = object({
  _id: uuid_schema,
  username: username_schema,
  roles: roles_schema
})

export const minimal_schema = object({
  _id: uuid_schema,
  username: username_schema,
})
