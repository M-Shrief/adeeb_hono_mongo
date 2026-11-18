import { boolean, object, optional, pipe, string } from "valibot";
////
import { RoleEnumType, TokenType } from "../../../database/schemas.js";
import { exp_schema, iat_schema, token_type_schema } from "../../../schemas/jwt.js"
import { uuid_schema } from "../../../schemas/general.js";

export type JWTType = {
 jti: string;
 family_id: string;
 token_type: TokenType;
 exp: Date;
 iat: Date;
 used: boolean;
 is_banned: boolean;
 user: {
    id: string;
    username: string;
    roles: RoleEnumType[];
 };
}


export const refresh_cookie_schema = object({
    refresh_token: pipe(string())
})

export const refresh_response_schema = object({access_token: string()})

export const update_one_req = object({
    family_id: optional(uuid_schema),
    used: optional(boolean()),
    is_banned: optional(boolean()),
    token_type: optional(token_type_schema),
    exp: optional(exp_schema),
    iat: optional(iat_schema),
    user: optional(uuid_schema),
})