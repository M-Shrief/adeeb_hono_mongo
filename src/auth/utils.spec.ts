import { describe, expect, it, vi, test, beforeAll } from 'vitest';
import { randomUUID } from "node:crypto"
////
import { RoleEnum, RoleEnumType, TokenTypeEnum } from '../database/schemas.js';
import { check_admin_permissions, check_item_ownership, verify_admin_user, verify_normal_user } from "./utils.js"
import * as time_utils from "../utils/time.js"
import { ACCESS_EXP_MIN_DELTA, create_permissions, new_claims, sign_jwt } from './jwt.js';
import { AuthError, AuthError_ReasonEnum } from './errors.js';

describe.concurrent("Testing Auth's utils module", async() => {
    let access_data = {
        jti: randomUUID(),
        family_id: randomUUID(),
        token_type: TokenTypeEnum.ACCESS,
        permissions: [] as string[],
        exp: time_utils.NowWithDelta(ACCESS_EXP_MIN_DELTA),
        iat: time_utils.Now()
    }
    let user_base = {
        id: "932ba7ba-8a4f-4282-8ca4-d0f9c0813bc1",
        username: "username1",
        roles: [] as RoleEnumType[]
    }
    test("Testing check_admin_permissions()", async() => {
        let is_admin: boolean
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL]))
        expect(is_admin).toEqual(false)
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL]), "write")
        expect(is_admin).toEqual(false)
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL, RoleEnum.DBA]))
        expect(is_admin).toEqual(true)
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL, RoleEnum.DBA]), "write")
        expect(is_admin).toEqual(true)
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]))
        expect(is_admin).toEqual(false)
        is_admin = await check_admin_permissions(await create_permissions([RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]), "write")
        expect(is_admin).toEqual(false)
    })

    test("Testing check_item_ownership()", async() => {
        let user = {...user_base}
        user.roles = [RoleEnum.NORMAL]
        access_data.permissions =  await create_permissions(user.roles)
        let access_claims = await new_claims(access_data, user)
        let is_owner: boolean
        let item = {
            owner_id: ""
        }
        item.owner_id = user.id
        is_owner = check_item_ownership(item.owner_id, access_claims)
        expect(is_owner).toEqual(true)
        
        access_claims = await new_claims(access_data, {id: randomUUID(), username: "saf", roles: []})
        is_owner = check_item_ownership(item.owner_id, access_claims)
        expect(is_owner).toEqual(false)
    })

    test("Testing verify_admin_user()", async() => {
        let expected_err = new AuthError(AuthError_ReasonEnum.PERM, "service")
        let user = {...user_base} // to deny race conditions

        user.roles = [RoleEnum.NORMAL, RoleEnum.MANAGMENT]
        access_data.permissions =  await create_permissions(user.roles)
        let access_claims = await new_claims(access_data, user)
        let access_token = await sign_jwt(access_claims)
        let claims = await verify_admin_user(access_token)
        expect(claims).toEqual(access_claims)

        try {
            user.roles = [RoleEnum.NORMAL]
            access_data.permissions =  await create_permissions(user.roles)
            let access_claims = await new_claims(access_data, user)
            let access_token = await sign_jwt(access_claims)
            let claims = await verify_admin_user(access_token)
        } catch(e) {
            expect(e).toBeInstanceOf(AuthError)
            expect(e).toEqual(expected_err)
        }

        try {
            user.roles = [RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]
            access_data.permissions =  await create_permissions(user.roles)
            let access_claims = await new_claims(access_data, user)
            let access_token = await sign_jwt(access_claims)
            let claims = await verify_admin_user(access_token)
        } catch(e) {
            expect(e).toBeInstanceOf(AuthError)
            expect(e).toEqual(expected_err)
        }
    })

    test("Testing verify_normal_user()", async() => {
        let expected_err = new AuthError(AuthError_ReasonEnum.PERM, "service")
        let user = {...user_base}
        user.roles = [RoleEnum.NORMAL]
        access_data.permissions =  await create_permissions(user.roles)
        let access_claims = await new_claims(access_data, user)
        let access_token = await sign_jwt(access_claims)
        let claims = await verify_normal_user(access_token)
        expect(claims).toEqual(access_claims)

        user.roles = [RoleEnum.NORMAL, RoleEnum.DBA]
        access_data.permissions =  await create_permissions(user.roles)
        access_claims = await new_claims(access_data, user)
        access_token = await sign_jwt(access_claims)
        claims = await verify_normal_user(access_token)
        expect(claims).toEqual(access_claims)

        try {
            user.roles = [RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]
            access_data.permissions =  await create_permissions(user.roles)
            let access_claims = await new_claims(access_data, user)
            let access_token = await sign_jwt(access_claims)
            let claims = await verify_admin_user(access_token)
        } catch(e) {
            expect(e).toBeInstanceOf(AuthError)
            expect(e).toEqual(expected_err)
        }
    })

})