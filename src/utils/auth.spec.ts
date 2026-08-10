import { describe, expect, it, vi, test, beforeAll } from 'vitest';
import bcrypt from "bcrypt"
////
import {compare_password, hash_password} from "./auth.js"

describe.concurrent("", async() => {
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
})

