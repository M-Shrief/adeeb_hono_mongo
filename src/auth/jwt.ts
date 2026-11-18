import { sign, verify } from 'hono/jwt'
import * as jwt_classes from 'hono/utils/jwt/types';
import { ACCESS_JWT_PRIVATE_KEY, ACCESS_JWT_PUBLIC_KEY, REFRESH_JWT_PRIVATE_KEY, REFRESH_JWT_PUBLIC_KEY } from '../config.js'
import {parse, ValiError} from "valibot"
// 
import { RoleEnum, RoleEnumType, TokenType, TokenTypeEnum } from '../database/schemas.js';
import { logger } from '../utils/logger.js';
import { getDateInSec } from '../utils/time.js';
import { Claims, claims_schema } from "../schemas/jwt.js"
import { AuthError_ReasonEnum, AuthError_ReasonEnumType } from './errors.js';

export async function sign_jwt(claims: Claims) {
    if (claims.token_type == "access") {
        return await sign(
            claims,
            ACCESS_JWT_PRIVATE_KEY,
            'RS256',
        );
    } else {
        return await sign(
            claims,
            REFRESH_JWT_PRIVATE_KEY,
            'RS256',
        );
    }
} 

// preserve types as object or object, so that we don't need to double check of claims & errors everytime.
export async function verify_jwt(token: string, type: TokenType = TokenTypeEnum.ACCESS): Promise<{claims: Claims, error: null} | {claims: null, error: AuthError_ReasonEnumType}>{
    try {
        let payload: jwt_classes.JWTPayload
        if (type == "refresh") {
            payload =  await verify(token, REFRESH_JWT_PUBLIC_KEY, "RS256") 
        } else {
            payload =  await verify(token, ACCESS_JWT_PUBLIC_KEY, "RS256") 
        }

        let claims: Claims = parse(claims_schema, payload)
        return {claims, error: null}

    } catch(e) {
        if(e instanceof ValiError) {
            return {claims: null, error: AuthError_ReasonEnum.INVALID_CLAIMS}
        }
        if(e instanceof jwt_classes.JwtTokenExpired) {
            return {claims: null, error: AuthError_ReasonEnum.EXPIRED}
        }
        if(e instanceof jwt_classes.JwtTokenNotBefore) {
            return {claims: null, error: AuthError_ReasonEnum.IMMATURE}
        }
        if(e instanceof jwt_classes.JwtTokenInvalid) {
            return {claims: null, error: AuthError_ReasonEnum.INVALID_TOKEN}
        }
        logger.error(`Error verifing JWT, error: ${e}`)
        return {claims: null, error: AuthError_ReasonEnum.UNKNOWN}
    }
} 

//  Access & Refresh tokens exp field in minutes
export const ACCESS_EXP_MIN_DELTA = 15
export const REFRESH_EXP_MIN_DELTA =  60 * 24 * 7

export async function new_claims(
    token_data: {jti: string, family_id: string, token_type: TokenType, exp: Date, iat: Date},
    user?: Claims["user"], 
): Promise<Claims> {
    let claims: Claims
    if (token_data.token_type == "refresh") {
        claims = {
            jti: token_data.jti,
            family_id: token_data.family_id,
            token_type: "refresh",
            exp: getDateInSec(token_data.exp),
            iat: getDateInSec(token_data.iat)
        }
    } else {
        let permissions = await create_permissions(user?.roles || [])
        claims = {
            jti: token_data.jti,
            family_id: token_data.family_id,
            user,
            permissions,
            token_type: "access",
            exp: getDateInSec(token_data.exp),
            iat: getDateInSec(token_data.iat)
        }
    }

    return claims
}


export type OPType = "write" | "read"

export function create_permission(role: RoleEnumType, op: OPType = "read") {
    return role + ":" + op
}

export async function create_permissions(roles: RoleEnumType[]) {
    let permissions: string[] = []

    for(let role of roles) {
        let write_permission = create_permission(role, "write")
        permissions.push(write_permission)

        let read_permission = create_permission(role, "read")
        permissions.push(read_permission)
    }

    return permissions
}

export const check_if_banned = (permissions: string[], op: OPType = "read") => {
    let is_banned = false

    for (let perm of permissions) {
        if (op == "write" && perm == create_permission(RoleEnum.BANNED, "write")) {
            is_banned = true
            break
        }
        else if (op == "read" && perm == create_permission(RoleEnum.BANNED, "read")) {
            is_banned = true
            break
        }
        continue
    }

    return is_banned
} 

export const check_if_permitted = (authorized_list: string[], permissions: string[], op: OPType = "read") => {
    let is_authorized = false
    let is_banned = false

    for (let perm of permissions) {
        if (op == "write" && perm == create_permission(RoleEnum.BANNED, "write")) {
            is_banned = true
            break
        }
        else if (op == "read" && perm == create_permission(RoleEnum.BANNED, "read")) {
            is_banned = true
            break
        }
        else {
            let index = authorized_list.indexOf(perm)
            if (index != -1) {
                is_authorized = true
            }
        }
    }

    if (is_banned) {
        is_authorized = false
    }

    return is_authorized
} 