import { describe, expect, it, vi, test, beforeAll } from 'vitest';
///////
import { safeParse } from 'valibot';
import { TimePeriodEnum } from '../../database/schemas.js';
import {create_many_req, create_one_req, get_one_res, update_req} from './schema.js'


describe.concurrent("Testing ProseQoutes' schema", async () => {
    const _id = '0343952d-58fc-4f56-b2b6-fc04731de5ce';
    const adeeb = {
        _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
        name: 'عنترة بن شداد',
    }
    let create_one_prose_qoute_req = {
        tags: ["tag1", "tag2"],
        qoute: "Qoutesgasg a",
        reviewed: true,
        adeeb: adeeb._id
    }
    describe("Testing get_one_res schema", async () => {
        test("Testing success", async() => {
            let one_response1 = {
                _id,
                ...create_one_prose_qoute_req,
                source: undefined,
                adeeb,
            }
            let res = safeParse(get_one_res, one_response1);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(one_response1);  
            let one_response2 = {
                _id,
                ...create_one_prose_qoute_req,
                source: undefined,
                adeeb,
            }
            res = safeParse(get_one_res, one_response2);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(one_response2);  
        })
        test("Testing faliure", async() => {
            let one_response1 = {
                _id,
                ...create_one_prose_qoute_req,
            }
            const res1 = safeParse(get_one_res, one_response1);
            expect(res1.success).toEqual(false);
            let one_response2 = {
                _id,
                qoute: "Qoutesgasg a ",
                reviewed: true,
                adeeb,
            }
            const res2 = safeParse(get_one_res, one_response2);
            expect(res2.success).toEqual(false);
        })
    })
    describe("Testing create_one_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_one_req, create_one_prose_qoute_req);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(create_one_prose_qoute_req);  
        })
        test("Testing failure", async() => {
            const res1 = safeParse(create_one_req, {
                tags: ["tag1", "tag2"],
                qoute: "Qoutesgasg a",
                reviewed: true,
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_one_req, {
                tags: ["tag1", "tag2"],
                qoute: 61262661,
                reviewed: null,
                adeeb: adeeb._id
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(create_one_req, {
                tags: ["tag1", "tag2"],
                qoute: "Qoutesgasg a",
                source: null,
                reviewed: true,
                adeeb: adeeb._id
            });
            expect(res3.success).toEqual(false);
        })
    })
    describe("Testing create_many_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_many_req, [create_one_prose_qoute_req,create_one_prose_qoute_req]);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual([create_one_prose_qoute_req,create_one_prose_qoute_req]);  
        })        
        test("Testing failure", async() => {
            const res1 = safeParse(create_many_req, [
                {
                    tags: ["tag1", "tag2"],
                    qoute: "Qoutesgasg a",
                    reviewed: true,
                },
                {
                    tags: ["tag1", "tag2"],
                    qoute: "Qoutesgasg a",
                },
                {
                    reviewed: true,
                    adeeb: adeeb._id
                }
            ]);
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_many_req, [
                {
                    tags: ["tag1", "tag2"],
                    qoute: "Qoutesgasg a",
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    tags: ["tag1", "tag2"],
                    qoute: "Qoutesgasg a",
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    tags: ["tag1", "tag2"],
                    qoute: "Qoutesgasg a",
                }
            ]);
            expect(res2.success).toEqual(false);
        })
    })
    describe("Testing update_req schema", async () => {
        test("Testing success", async() => {
            const res1 = safeParse(update_req, {
                tags: ["tag1", "tag2"],
            });
            expect(res1.success).toEqual(true);
            const res2 = safeParse(update_req, {
                reviewed: true,
                adeeb: adeeb._id
            });
            expect(res2.success).toEqual(true);
            const res3 = safeParse(update_req, {
                qoute: "Qoutesgasg a",
                source: "gasga"
            });
            expect(res3.success).toEqual(true);
        })
        test("Testing failure", async() => {
            const res1 = safeParse(update_req, {
                tags: 21552115,
                qoute: "Qoutesgasg a",
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(update_req, {
                adeeb: "adeeb._id"
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(update_req, {
                tags: ["tag1", "tag2"],
                qoute: "Qoutesgasg a",
                reviewed: true,
                source: null,
            });
            expect(res3.success).toEqual(false);

        })
    })
})