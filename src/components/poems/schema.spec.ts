import { describe, expect, it, vi, test, beforeAll } from 'vitest';
///////
import { safeParse } from 'valibot';
import {create_many_req, create_one_req, get_one_res, update_req} from './schema.js'


describe.concurrent("Testing Poems' schema", async () => {
    const _id = '0343952d-58fc-4f56-b2b6-fc04731de5ce';
    const adeeb = {
        _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
        name: 'عنترة بن شداد',
    }
    let create_one_poem_req = {
        intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
        verses: [
            "verse1",
            "verse2",
            "verse3",
            "verse4",
        ],
        is_couplet: true,
        reviewed: true,
        adeeb: adeeb._id
    }
    let chosen_verses = [
        {
            _id: '116d9b44-2a7b-4739-9014-d19a7677dd72',
            verses: [
                'فَكَأَنَّما برقعت وَجه نَهاري',
                'لا ذَنبَ لي كَم رمت كتم فَضائِلي',
            ],
            is_couplet: true,
        },
    ]
    describe("Testing get_one_res schema", async () => {
        test("Testing success", async() => {
            let one_response = {
                _id,
                ...create_one_poem_req,
                adeeb,
                chosen_verses,
            }
            const res = safeParse(get_one_res, one_response);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(one_response);  
        })
        test("Testing faliure", async() => {
            let one_response1 = {
                _id,
                ...create_one_poem_req,
                chosen_verses,
            }
            const res1 = safeParse(get_one_res, one_response1);
            expect(res1.success).toEqual(false);
            let one_response2 = {
                _id,
                ...create_one_poem_req,
                adeeb,
            }
            const res2 = safeParse(get_one_res, one_response2);
            expect(res2.success).toEqual(false);
        })
    })
    describe("Testing create_one_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_one_req, create_one_poem_req);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(create_one_poem_req);  
        })
        test("Testing failure", async() => {
            const res1 = safeParse(create_one_req, {
                intro: 1251,
                verses: [
                    "verse1",
                    "verse2",
                    "verse3",
                    "verse4",
                ],
                adeeb: adeeb._id
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_one_req, {
                intro: "agsgsags",
                verses: "asgsag",
                adeeb: adeeb._id
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(create_one_req, {
                intro: "agsgsags",
                verses: [
                    "verse1",
                    "verse2",
                    "verse3",
                    "verse4",
                ],
                adeeb: 125521
            });
            expect(res3.success).toEqual(false);
        })
    })
    describe("Testing create_many_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_many_req, [create_one_poem_req,create_one_poem_req]);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual([create_one_poem_req,create_one_poem_req]);  
        })        
        test("Testing failure", async() => {
            const res1 = safeParse(create_many_req, [
                {
                    intro: 521521,
                    verses: [
                        "verse1",
                        "verse2",
                        "verse3",
                        "verse4",
                    ],
                    is_couplet: true,
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    intro: 521521,
                    verses: [
                        "verse1",
                        "verse2",
                        "verse3",
                        "verse4",
                    ],
                    is_couplet: true,
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    intro: 521521,
                    verses: [
                        "verse1",
                        "verse2",
                        "verse3",
                        "verse4",
                    ],
                    is_couplet: true,
                    reviewed: true,
                    adeeb: adeeb._id
                }
            ]);
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_many_req, [
                {
                    intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
                    verses: [
                        "verse1",
                        "verse2",
                        "verse3",
                        "verse4",
                    ],
                    is_couplet: true,
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
                    is_couplet: true,
                    reviewed: true,
                    adeeb: adeeb._id
                },
                {
                    intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
                    verses: [
                        "verse1",
                        "verse2",
                        "verse3",
                        "verse4",
                    ],
                    is_couplet: true,
                }
            ]);
            expect(res2.success).toEqual(false);
        })
    })
    describe("Testing update_req schema", async () => {
        test("Testing success", async() => {
            const res1 = safeParse(update_req, {
                intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
                adeeb: adeeb._id
            });
            expect(res1.success).toEqual(true);
            const res2 = safeParse(update_req, {
                reviewed: true,
                adeeb: adeeb._id
            });
            expect(res2.success).toEqual(true);
            const res3 = safeParse(update_req, {
                intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
                verses: [
                    "verse1",
                    "verse2",
                    "verse3",
                    "verse4",
                ]
            });
            expect(res3.success).toEqual(true);
        })
        test("Testing failure", async() => {
            const res1 = safeParse(update_req, {
                intro: 125,
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(update_req, {
                verses: "Jagsgsa",
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(update_req, {
                intro: 125,
                verses: "Jagsgsa",
            });
            expect(res3.success).toEqual(false);

        })
    })
})