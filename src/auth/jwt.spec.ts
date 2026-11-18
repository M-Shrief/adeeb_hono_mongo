import { describe, expect, it, vi, test, beforeAll } from 'vitest';
import { randomUUID } from "node:crypto"
import {sign, verify} from 'hono/jwt'
import { JWTPayload } from 'hono/utils/jwt/types';
////
import {ACCESS_JWT_PRIVATE_KEY, ACCESS_JWT_PUBLIC_KEY, REFRESH_JWT_PRIVATE_KEY, REFRESH_JWT_PUBLIC_KEY} from '../config.js'
import { RoleEnum, RoleEnumType, TokenTypeEnum } from '../database/schemas.js';
import { ACCESS_EXP_MIN_DELTA, REFRESH_EXP_MIN_DELTA, new_claims, check_if_permitted, create_permission, create_permissions, sign_jwt, verify_jwt, check_if_banned} from "./jwt.js"
import * as time_utils from "../utils/time.js"

describe.concurrent("Testing Auth's JWT module", async() => {
    let jti = randomUUID()
    let family_id = randomUUID()
    let user = {
        id: "932ba7ba-8a4f-4282-8ca4-d0f9c0813bc1",
        username: "username1",
        roles: [RoleEnum.NORMAL, RoleEnum.DBA]
    }
    let permissions = await create_permissions(user.roles)
    let access_data = {
        jti,
        family_id,
        token_type: TokenTypeEnum.ACCESS,
        exp: time_utils.NowWithDelta(ACCESS_EXP_MIN_DELTA),
        iat: time_utils.Now()
    }
    let refreh_data = {
        jti,
        family_id,
        token_type: TokenTypeEnum.REFRESH,
        exp: time_utils.NowWithDelta(REFRESH_EXP_MIN_DELTA),
        iat: time_utils.Now()
    }

    describe.concurrent("Testing sign_jwt()", async() => {
        test("Correctly sign_jwt() for access token", async() => {
            let access_claims = await new_claims(access_data, user)
            let token = await sign_jwt(access_claims)
            let payload = await verify(token, ACCESS_JWT_PUBLIC_KEY, "RS256") 

            expect(payload["jti"]).toEqual(access_data.jti)
            expect(payload["family_id"]).toEqual(access_data.family_id)
            expect(payload["token_type"]).toEqual(access_data.token_type)


            let exp = payload["exp"]
            let iat = payload["iat"]
            expect(exp).not.toBeNull()
            expect(iat).not.toBeNull()
            expect(exp! > iat!).toBeTruthy()
            let delta_secs = exp! - iat!
            expect(delta_secs > 60 * (ACCESS_EXP_MIN_DELTA - 1)).toBeTruthy()
            expect(delta_secs < 60 * (ACCESS_EXP_MIN_DELTA + 1)).toBeTruthy()

            let payload_user = payload["user"] as typeof user
            expect(payload_user["id"]).toEqual(user.id)
            expect(payload_user["username"]).toEqual(user.username)
            expect(payload_user["roles"]).toEqual(user.roles)      
            let payload_perms = payload["permissions"] as string[]
            expect(payload_perms.length).toBe(user.roles.length * 2)
            expect(payload_perms.indexOf(create_permission(user.roles[0], "read"))).not.toEqual(-1)

        })

        test("Correctly sign_jwt() for refresh token", async() => {
            let refresh_claims = await new_claims(refreh_data)
            let token = await sign_jwt(refresh_claims)

            let payload = await verify(token, REFRESH_JWT_PUBLIC_KEY, "RS256") 

            expect(payload["jti"]).toEqual(refreh_data.jti)
            expect(payload["family_id"]).toEqual(refreh_data.family_id)
            expect(payload["token_type"]).toEqual(refreh_data.token_type)

            let exp = payload["exp"]
            let iat = payload["iat"]
            expect(exp).not.toBeNull()
            expect(iat).not.toBeNull()
            expect(exp! > iat!).toBeTruthy()
            let delta_secs = exp! - iat!
            expect(delta_secs > 60 * (REFRESH_EXP_MIN_DELTA - 1)).toBeTruthy()
            expect(delta_secs < 60 * (REFRESH_EXP_MIN_DELTA + 1)).toBeTruthy()

            let payload_user = payload["user"]
            expect(payload_user).toBeUndefined()
            let payload_perms = payload["permissions"]
            expect(payload_perms).toBeUndefined()
        })
    })

    describe.concurrent("Testing verify_jwt()", async() => {
        test("Testing verify_token() for access token", async() => {
            let token = await sign(
                {
                    jti,
                    family_id,
                    user: user, 
                    token_type: TokenTypeEnum.ACCESS,
                    permissions: permissions, 
                    exp: time_utils.getDateInSec(time_utils.NowWithDelta(ACCESS_EXP_MIN_DELTA)),
                    iat: time_utils.getDateInSec(time_utils.Now()),
                },
                ACCESS_JWT_PRIVATE_KEY,
                'RS256',
            );

            let result = await verify_jwt(token)
            expect(result.error).toBeNull()
            expect(result.claims).not.toBeNull()

            expect(result.claims!.user).not.toBeNull()
            expect(result.claims!.user!.id).toEqual(user.id)
            expect(result.claims!.user!.username).toEqual(user.username)
            expect(result.claims!.user!.roles).toEqual(user.roles)      

            expect(result.claims!.permissions!.length).toBe(user.roles.length * 2)
            expect(result.claims!.permissions!.indexOf(create_permission(user.roles[0], "read"))).not.toEqual(-1)
        })

        test("Testing verify_token() for refresh token", async() => {
            let token = await sign(
                {
                    jti,
                    family_id,
                    token_type: TokenTypeEnum.REFRESH,
                    exp: time_utils.getDateInSec(time_utils.NowWithDelta(REFRESH_EXP_MIN_DELTA)),
                    iat: time_utils.getDateInSec(time_utils.Now()),
                },
                ACCESS_JWT_PRIVATE_KEY,
                'RS256',
            );

            let result = await verify_jwt(token)
            expect(result.error).toBeNull()
            expect(result.claims).not.toBeNull()

            expect(result.claims!.user).toBeUndefined()
            expect(result.claims!.permissions).toBeUndefined()
        })
    })

    test("testing new_claims()", async() => {
        let jti = randomUUID()
        let family_id = randomUUID()
        let user = {
            id: "932ba7ba-8a4f-4282-8ca4-d0f9c0813bc1",
            username: "username1",
            roles: [RoleEnum.NORMAL, RoleEnum.DBA]
        }
        let permissions = await create_permissions(user.roles)
        let access_data = {
            jti,
            family_id,
            token_type: TokenTypeEnum.ACCESS,
            exp: time_utils.NowWithDelta(ACCESS_EXP_MIN_DELTA),
            iat: time_utils.Now()
        }
        let access_claims = await new_claims(access_data, user)
        expect(access_claims.jti).toEqual(access_data.jti)
        expect(access_claims.family_id).toEqual(access_data.family_id)
        expect(access_claims.token_type).toEqual("access")
        expect(access_claims.exp).toEqual(time_utils.getDateInSec(access_data.exp))
        expect(access_claims.iat).toEqual(time_utils.getDateInSec(access_data.iat))
        expect(access_claims.user!.id).toEqual(user.id)
        expect(access_claims.user!.username).toEqual(user.username)
        expect(access_claims.user!.roles).toEqual(user.roles)
        expect(access_claims.permissions!.length).toBe(user.roles.length * 2)
        expect(access_claims.permissions!.indexOf(create_permission(user.roles[0], "read"))).not.toEqual(-1)

        let refreh_data = {
            jti,
            family_id,
            token_type: TokenTypeEnum.REFRESH,
            exp: time_utils.NowWithDelta(REFRESH_EXP_MIN_DELTA),
            iat: time_utils.Now()
        }
        let refresh_claims = await new_claims(refreh_data)
        expect(refresh_claims.jti).toEqual(refreh_data.jti)
        expect(refresh_claims.family_id).toEqual(refreh_data.family_id)
        expect(refresh_claims.token_type).toEqual("refresh")
        expect(refresh_claims.exp).toEqual(time_utils.getDateInSec(refreh_data.exp))
        expect(refresh_claims.iat).toEqual(time_utils.getDateInSec(refreh_data.iat))
        expect(refresh_claims.user).toBeUndefined()
        expect(refresh_claims.permissions).toBeUndefined()
    })

    describe.concurrent("Testing permissions-related functions", async() => {
        test("Testing check_if_permitted()", async() => {
            let is_authorized: boolean

            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permissions = await create_permissions(roles1)
            let authorized_list1 = [
                create_permission(RoleEnum.MANAGMENT, "read"),
                create_permission(RoleEnum.DBA, "read"),
                create_permission(RoleEnum.ANALYTICS, "read")
            ]
            is_authorized = await check_if_permitted(authorized_list1, permissions, "read")
            expect(is_authorized).toBe(true)

            let roles2: RoleEnumType[] = [RoleEnum.NORMAL]
            let permissions2 = await create_permissions(roles2)
            let authorized_list2 = [
                create_permission(RoleEnum.MANAGMENT, "read"),
                create_permission(RoleEnum.DBA, "read"),
                create_permission(RoleEnum.ANALYTICS, "read")
            ]
            is_authorized = check_if_permitted(authorized_list2, permissions2, "read")
            expect(is_authorized).toBe(false)

            let roles3: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]
            let permissions3 = await create_permissions(roles3)
            let authorized_list3 = [
                create_permission(RoleEnum.MANAGMENT, "read"),
                create_permission(RoleEnum.DBA, "read"),
                create_permission(RoleEnum.ANALYTICS, "read")
            ]
            is_authorized = check_if_permitted(authorized_list3, permissions3, "read")
            expect(is_authorized).toBe(false)

            let permissions4 = [
                create_permission(RoleEnum.NORMAL, "read"),
                create_permission(RoleEnum.DBA, "read"),
            ]
            let authorized_list4 = [
                create_permission(RoleEnum.MANAGMENT, "write"),
                create_permission(RoleEnum.DBA, "write"),
                create_permission(RoleEnum.ANALYTICS, "write")
            ]
            is_authorized = check_if_permitted(authorized_list4, permissions4, "write")
            expect(is_authorized).toBe(false)
        })

        test("Testing check_if_banned()", async() => {
            let is_banned: boolean

            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permissions = await create_permissions(roles1)
            is_banned = await check_if_banned(permissions, "read")
            expect(is_banned).toBe(false)

            let roles2: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.BANNED]
            let permissions2 = await create_permissions(roles2)
            is_banned = check_if_banned(permissions2, "read")
            expect(is_banned).toBe(true)
        })

        test("Testing create_permissions()", async () => {
            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permisions = await create_permissions(roles1)

            expect(permisions.length).toEqual(roles1.length * 2)
            let perm1_indx = permisions.indexOf(create_permission(roles1[0], "read"))
            expect(perm1_indx).toBeGreaterThan(-1)
            let perm2_indx = permisions.indexOf(create_permission(roles1[1], "write"))
            expect(perm2_indx).toBeGreaterThan(-1)
            let perm3_indx = permisions.indexOf(create_permission(RoleEnum.BANNED, "write"))
            expect(perm3_indx).toBe(-1)
        })
        
        test("Testing create_permission()", async () => {
            let role1 = RoleEnum.DBA
            let wanted_result1 = role1 + ":" + "read"
            let permission1 = create_permission(role1,"read")
            expect(permission1).toEqual(wanted_result1)

            let role2 = RoleEnum.NORMAL
            let wanted_result2 = role2 + ":" + "write"
            let permission2 = create_permission(role2,"write")
            expect(permission2).toEqual(wanted_result2)

        })
    })
})


