import { decode, sign, verify } from 'hono/jwt'
import { JWTPayload } from 'hono/utils/jwt/types';
import bcrypt from "bcrypt"
import { object, string } from 'valibot';
// import { createMiddleware } from 'hono/factory';
////
import { JWT_PRIVATE_KEY, JWT_PUBLIC_KEY } from '../config.js'
import { RoleEnum } from '../database/schemas.js';
import { createMiddleware } from 'hono/factory';
import { HttpStatusCode } from './api.js';

export const auth_header_schema = object({ authorization: string()})

export const hash_password = async (password: string) => {
  const salt = bcrypt.genSaltSync(); // default 10
  return await bcrypt.hash(password, salt);
};

export const compare_password = async (password: string, pass_hash: string) =>
  await bcrypt.compare(password, pass_hash);


export const OP = {
    WRITE: "write",
    READ: "read"
} as const
type OP_ENUM = typeof OP[keyof typeof OP];


export type RoleEnumType = typeof RoleEnum[keyof typeof RoleEnum];

export function create_permission(role: RoleEnumType, op: OP_ENUM = OP.READ): string {
    return role + ":" + op
}

export function create_permissions(roles: RoleEnumType[]) {
    let permissions: string[] = []

    for(let role of roles) {
        let read_permission = create_permission(role, OP.READ)
        permissions.push(read_permission)

        let write_permission = create_permission(role, OP.WRITE)
        permissions.push(write_permission)
    }

    return permissions
}


export const sign_token = async (id: string, username: string, roles: RoleEnumType[], exp_after_hours: number = 2) => {
    let user = {
        id,
        username,
        roles
    }
    let permissions = create_permissions(roles)

    return await sign(
        {
            user,
            permissions,
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * exp_after_hours, // default is 2 Hours.
            iat: Math.floor(Date.now() / 1000),
        },
        JWT_PRIVATE_KEY,
        'RS256',
    );
};

/**
 * Verify JWT token, it verifies payload's exp, iat...etc as long as they're provided in the payload.
 */
export const verify_token = async (auth_header: string): Promise<JWTPayload | null> => {
    try {
        let token = auth_header.slice(7)

        let payload =  await verify(token, JWT_PUBLIC_KEY, "RS256") 

        return payload
    } catch(e) {
        return null
    }
}


export const check_permission = (authorized_list: string[], permissions: string[], op: OP_ENUM = OP.READ) => {
    let is_authorized = false
    let is_banned = false

    for (let perm of permissions) {
        if (op == OP.WRITE && perm == create_permission(RoleEnum.BANNED, OP.WRITE)) {
            is_banned = true
            break
        }
        else if (op == OP.READ && perm == create_permission(RoleEnum.BANNED, OP.READ)) {
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

export const check_if_adminstrator = (user_permissions: string[], op: OP_ENUM = "read"): boolean => {
    let authorized_list = [
        create_permission(RoleEnum.MANAGMENT, op),
        create_permission(RoleEnum.DBA, op),
        create_permission(RoleEnum.ANALYTICS, op),
    ]

    return check_permission(authorized_list, user_permissions, op)
}

export const check_ownership = (item_owner_id: string | null, jwt_payload: JWTPayload) => {
    let user: any = jwt_payload["user"]
    let user_id: string = user["id"]
    if (!item_owner_id) { // if it doesn't belong to signed up user
        return false
    }
    if (item_owner_id != user_id) { // if the user is not the owner of the order
        return false
    }
    return true
}


/**
 * A middleware used to check if adminstrator authority in WRITE operations in domain components, 
 * like: POST/PUT/DELETE operations in adeebs component.
 */
export const verify_adminstrator = () =>
  createMiddleware(async (c, next) => {
    let auth_header = c.req.header("Authorization")
    
    let payload = await verify_token(auth_header!) // header was already validated
    if (!payload) {
        return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
    }

    let permissions = payload["permissions"] as string[]
    let is_adminstrator = check_if_adminstrator(permissions, OP.READ)
    if (!is_adminstrator) {
        return c.json({ message: "Not Authorized"}, HttpStatusCode.UNAUTHORIZED) 
    }

    await next();
  });
