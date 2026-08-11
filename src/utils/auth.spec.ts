import { describe, expect, it, vi, test, beforeAll } from 'vitest';
import bcrypt from "bcrypt"
import {sign, verify} from 'hono/jwt'
import { JWTPayload } from 'hono/utils/jwt/types';
////
import {JWT_PRIVATE_KEY, JWT_PUBLIC_KEY} from '../config.js'
import { RoleEnum } from '../database/schemas.js';
import {OP, RoleEnumType, check_permission, compare_password, create_permission, create_permissions, hash_password, sign_token, verify_token} from "./auth.js"

describe.concurrent("Auth utils", async() => {
    describe("for Password Hashing", async() => {
        let password = "password"
        test("Testing hash_password()", async() => {
            let is_valid: boolean
            let hash1 = await hash_password(password)
            is_valid = await bcrypt.compare(password, hash1)
            expect(is_valid).toBe(true)
            let hash2 = await hash_password(password)
            is_valid = await bcrypt.compare(password, hash2)
            expect(is_valid).toBe(true)
            let hash3 = await hash_password("other password")
            is_valid = await bcrypt.compare(password, hash3)
            expect(is_valid).toBe(false)
        })
        test("Testing compare_password()", async() => {
            let is_valid: boolean            
            let hash1 = await bcrypt.hash(password, bcrypt.genSaltSync())
            is_valid = await compare_password(password, hash1)
            expect(is_valid).toBe(true)
            let hash2 = await bcrypt.hash(password, bcrypt.genSaltSync())
            is_valid = await compare_password(password, hash2)
            expect(is_valid).toBe(true)
            let hash3 = await bcrypt.hash("other password", bcrypt.genSaltSync())
            is_valid = await compare_password(password, hash3)
            expect(is_valid).toBe(false)

        })
    })
    describe("for Permissions & Authorization", async() => {
        test("Testing create_permission()", async () => {
            let role1 = RoleEnum.DBA
            let op1 = OP.READ
            let wanted_result1 = role1 + ":" + op1
            let permission1 = create_permission(role1,op1)
            expect(permission1).toEqual(wanted_result1)

            let role2 = RoleEnum.NORMAL
            let op2 = OP.WRITE
            let wanted_result2 = role2 + ":" + op2
            let permission2 = create_permission(role2,op2)
            expect(permission2).toEqual(wanted_result2)

        })
        test("Testing create_permissions()", async () => {
            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permisions = create_permissions(roles1)

            expect(permisions.length).toEqual(roles1.length * 2)
            let perm1_indx = permisions.indexOf(create_permission(roles1[0], OP.READ))
            expect(perm1_indx).toBeGreaterThan(-1)
            let perm2_indx = permisions.indexOf(create_permission(roles1[1], OP.WRITE))
            expect(perm2_indx).toBeGreaterThan(-1)
            let perm3_indx = permisions.indexOf(create_permission(RoleEnum.BANNED, OP.WRITE))
            expect(perm3_indx).toBe(-1)
        })
        test("Testing check_permission()", async() => {
            let is_authorized: boolean

            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permissions1 = create_permissions(roles1)
            let authorized_list1 = [
                create_permission(RoleEnum.MANAGMENT, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
                create_permission(RoleEnum.ANALYTICS, OP.READ)
            ]
            is_authorized = check_permission(authorized_list1, permissions1, OP.READ)
            expect(is_authorized).toBe(true)

            let roles2: RoleEnumType[] = [RoleEnum.NORMAL]
            let permissions2 = create_permissions(roles2)
            let authorized_list2 = [
                create_permission(RoleEnum.MANAGMENT, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
                create_permission(RoleEnum.ANALYTICS, OP.READ)
            ]
            is_authorized = check_permission(authorized_list2, permissions2, OP.READ)
            expect(is_authorized).toBe(false)

            let roles3: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA, RoleEnum.BANNED]
            let permissions3 = create_permissions(roles3)
            let authorized_list3 = [
                create_permission(RoleEnum.MANAGMENT, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
                create_permission(RoleEnum.ANALYTICS, OP.READ)
            ]
            is_authorized = check_permission(authorized_list3, permissions3, OP.READ)
            expect(is_authorized).toBe(false)

            let permissions4 = [
                create_permission(RoleEnum.NORMAL, OP.READ),
                create_permission(RoleEnum.DBA, OP.READ),
            ]
            let authorized_list4 = [
                create_permission(RoleEnum.MANAGMENT, OP.WRITE),
                create_permission(RoleEnum.DBA, OP.WRITE),
                create_permission(RoleEnum.ANALYTICS, OP.WRITE)
            ]
            is_authorized = check_permission(authorized_list4, permissions4, OP.WRITE)
            expect(is_authorized).toBe(false)
        })
    })
    describe("for JWT", async() => {
        test("Testing sign_token()", async () => {
            let user1 = {
                id: "932ba7ba-8a4f-4282-8ca4-d0f9c0813bc1",
                username: "username1",
                roles: [RoleEnum.NORMAL, RoleEnum.DBA]
            }
            let exp_delta1 = 2
            let token1 = await sign_token(user1.id, user1.username, user1.roles, exp_delta1) 
            // if verify works without errors, then exp & iat are correct
            let payload1 = await verify(token1, JWT_PUBLIC_KEY, "RS256") 
            // To have the difference between iat & exp == exp_delta
            expect((payload1.exp as number) - (payload1.iat as number)).toEqual(60 * 60 * exp_delta1)

            let payload_user1 = payload1["user"] as typeof user1
            expect(payload_user1["id"]).toEqual(user1.id)
            expect(payload_user1["username"]).toEqual(user1.username)
            expect(payload_user1["roles"]).toEqual(user1.roles)      

            let payload_perms1 = payload1["permissions"] as string[]
            expect(payload_perms1.length).toBe(user1.roles.length * 2)
            expect(payload_perms1.indexOf(create_permission(user1.roles[0], OP.READ))).not.toEqual(-1)
        })

        test("Testing verify_token()", async() => {
            let payload: JWTPayload | null
            let now = Math.floor(Date.now() / 1000)
            let roles1: RoleEnumType[] = [RoleEnum.NORMAL, RoleEnum.DBA]
            let permissions1 = create_permissions(roles1)
            let user1 = {
                id: "932ba7ba-8a4f-4282-8ca4-d0f9c0813bc1",
                username: "username1",
                roles: roles1
            }
            let token1 = await sign(
                {user: user1, permissions: permissions1, exp: now + 60 * 60 * 1,iat: now},
                JWT_PRIVATE_KEY,
                'RS256',
            );
            let auth_header1 = `Bearer ${token1}`
            payload = await verify_token(auth_header1)
            expect(payload).not.toBeNull()

            if(payload) {
                let payload_user1 = payload["user"] as typeof user1
                expect(payload_user1["id"]).toEqual(user1.id)
                expect(payload_user1["username"]).toEqual(user1.username)
                expect(payload_user1["roles"]).toEqual(user1.roles)      

                let payload_perms1 = payload["permissions"] as string[]
                expect(payload_perms1.length).toBe(user1.roles.length * 2)
                expect(payload_perms1.indexOf(create_permission(user1.roles[0], OP.READ))).not.toEqual(-1)
            }

            let token2 = await sign(
                {user: user1, permissions: permissions1, exp: now + 60 * 60 * -1,iat: now},
                JWT_PRIVATE_KEY,
                'RS256',
            );
            let auth_header2 = `Bearer ${token2}`
            payload = await verify_token(auth_header2)
            expect(payload).toBeNull()


            let token3 = await sign(
                {user: user1, permissions: permissions1, exp: now + 60 * 60 * 2,iat: now + 60 * 60 * 1},
                JWT_PRIVATE_KEY,
                'RS256',
            );
            let auth_header3 = `Bearer ${token3}`
            payload = await verify_token(auth_header3)
            expect(payload).toBeNull()

        })
    })
})

