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
  fallback,
  boolean,
  date,
  enum as enum_schema,
  InferOutput
} from 'valibot';
/////
import { TokenType, TokenTypeEnum, RoleEnumType } from '../database/schemas.js';
import { uuid_schema } from './general.js';
import { roles_schema, username_schema } from './user.js';

export const is_banned_schema = fallback(boolean(), false);
export const used_schema = fallback(boolean(), false);
export const exp_schema = date()
export const iat_schema = date()
export const token_type_schema = enum_schema(TokenTypeEnum);


export const one_schema = object({
  jti: uuid_schema,
  family_id: uuid_schema,
  user: uuid_schema,
  used: used_schema,
  token_type: token_type_schema,
  is_banned: is_banned_schema,
  exp: exp_schema,
  iat: iat_schema
})

export type Claims = {
  jti: string, 
  family_id: string,
  user?: {
    id: string,
    username: string,
    roles: RoleEnumType[]
  },
  token_type: TokenType,
  permissions?: string[],
  exp: number,
  iat: number,
} 

export const claims_schema = object({
  jti: uuid_schema, // no need to stick to jti naming-convention, as we use mongodb
  family_id: uuid_schema,
  user: optional(object({
   id: uuid_schema,
   username: username_schema,
   roles: roles_schema, 
  })),
  token_type: token_type_schema,
  permissions: optional(array(string())),
  exp: number(),
  iat: number()
})

// Infer the output type
// export type Claims = InferOutput<typeof claims_schema>;