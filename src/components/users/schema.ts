import {
  optional,
  object,
  string,
} from 'valibot';
/////////////
import { one_schema, username_schema, password_schema, roles_schema } from "../../schemas/user.js"

export const signup_req = object({
  username: username_schema,
  password: password_schema,
  roles: roles_schema
});

export const login_req = object({
  username: username_schema,
  password: password_schema,
});

export const user_authorized_res = object({
  user: one_schema,
  access_token: string(),  
});

export const update_current_req = object({
  username: optional(username_schema),
  password: optional(password_schema),
});

export const update_one_req = object({
  username: optional(username_schema),
  password: optional(password_schema),
  roles: optional(roles_schema),
});
