import { Context } from 'hono';
import { setCookie } from 'hono/cookie'
import { createMiddleware } from 'hono/factory';
import { object, string } from 'valibot';
// 
import { RoleEnum } from '../database/schemas.js';
import { AuthError, AuthError_ReasonEnum, new_auth_error_response } from './errors.js';
import {create_permission, check_if_permitted, type OPType, verify_jwt, REFRESH_EXP_MIN_DELTA } from "./jwt.js"
import { type Claims } from '../schemas/jwt.js';
import { logger } from '../utils/logger.js';
import { HttpStatusCode } from '../utils/api.js';
import { CausedIn } from '../utils/errors.js';

export const auth_header_schema = object({ authorization: string()})

export async function set_refresh_token_cookie(c: Context, refresh_token: string){
    setCookie(
        c, 
        'refresh_token', 
        refresh_token,
        {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 60 * REFRESH_EXP_MIN_DELTA,
        }
    )
    return c
}


export const check_admin_permissions = (user_permissions: string[], op: OPType = "read"): boolean => {
    let authorized_list = [
        create_permission(RoleEnum.MANAGMENT, op),
        create_permission(RoleEnum.DBA, op),
        create_permission(RoleEnum.ANALYTICS, op),
    ]

    return check_if_permitted(authorized_list, user_permissions, op)
}

export const check_item_ownership = (item_owner_id: string | null, claims: Claims) => {    
    if (!item_owner_id) { // if it doesn't belong to signed up user, 
        return false
    }
    if (!claims.user) {
        return false
    }
    if (item_owner_id != claims.user.id) { // if the user is not the owner of the order
        return false
    }
    return true
}

export const verify_admin_user = async (token: string, op: OPType = "read", caused_in: CausedIn = "service") => {
    let result = await verify_jwt(token)
    if (result.error != null ) { // if it's a string, then it threw AuthError. And it's value is AuthError.reason 
        throw new AuthError(result.error, caused_in)
    }
    let is_authorized = check_admin_permissions(result.claims.permissions!, op)
    if (!is_authorized) {
        throw new AuthError(AuthError_ReasonEnum.PERM, caused_in)
    }

    return result.claims
}
export const verify_normal_user = async (token: string, op: OPType = "read", caused_in: CausedIn = "service") => {
    let result = await verify_jwt(token)
    if (result.error != null ) { // if it's a string, then it threw AuthError. And it's value is AuthError.reason 
        throw new AuthError(result.error, caused_in)
    }

    let authorized_list = [
        create_permission(RoleEnum.NORMAL, op),
    ]
    
    let is_authorized = check_if_permitted(authorized_list, result.claims.permissions!, op)
    if (!is_authorized) {
        throw new AuthError(AuthError_ReasonEnum.PERM, caused_in)
    }

    return result.claims
}

/**
 * A middleware used to check if adminstrator authority in WRITE operations in domain components, 
 * like: POST/PUT/DELETE operations in adeebs component.
 */
export const verify_admin_middleware = () =>
  createMiddleware(async (c, next) => {
    try {
        let auth_header = c.req.header("Authorization")
        if (!auth_header) {
            return new_auth_error_response(c, AuthError_ReasonEnum.INVALID_TOKEN) 
        }

        await verify_admin_user(auth_header.slice(7), "write", "middleware")
        await next();
    } catch(e) {
        if(e instanceof AuthError) {
            return new_auth_error_response(c, e.reason) 
        }
        logger.error("Unknown error verifying admin user")
        return c.json({message: "Unknown error verify admin user, try again later"}, HttpStatusCode.BAD_REQUEST)
    }
  });
