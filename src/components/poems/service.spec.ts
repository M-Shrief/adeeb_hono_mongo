import { describe, expect, it, vi, test, beforeAll } from 'vitest';
////
import { service } from './service.js';
import { repository } from './repository.js';
import { APIError } from '../../utils/errors.js';
import { HttpStatusCode } from '../../utils/api.js';
import { TimePeriodEnum } from '../../database/schemas.js';


describe.concurrent("Testing Poems' service", async () => {
    describe("Testing get_all()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        const poem = {
            _id,
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
        let get_data_result = {
            data: [poem, poem],
            limit: 2,
            offset: 0,
            total_count: 10
        } 
        test("Success Test", async() => {
            vi.spyOn(repository, "get_all").mockResolvedValue(get_data_result)
            await expect(service.get_all(2,0)).resolves.toEqual(get_data_result)
        })

        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "get_all").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.get_all(2,0)).rejects.toThrow(bad_req_err)
        })
    })
    describe("Testing get_one_by_id()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
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
        const poem = {
            _id,
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            reviewed: true,
            adeeb,
            chosen_verses,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "get_one_by_id").mockResolvedValue(poem)
            await expect(service.get_one_by_id(_id)).resolves.toEqual(poem)
        })

        test("Fail Test: APIError=404", async() => {
            const not_found_err = new APIError(HttpStatusCode.NOT_FOUND, "repository")
            vi.spyOn(repository, "get_one_by_id").mockThrow(new APIError(HttpStatusCode.NOT_FOUND, "repository"))
            await expect(service.get_one_by_id(_id)).rejects.toThrow(not_found_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "get_one_by_id").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.get_one_by_id(_id)).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing create_one()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        let date = new Date() 
        let created_at = date
        let updated_at = date
        const poem = {
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
        test("Success Test", async() => {
            vi.spyOn(repository, "create_one").mockResolvedValue({_id, created_at, updated_at, ...poem} as any)
            await expect(service.create_one(poem)).resolves.toEqual({_id, created_at, updated_at, ...poem})
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.create_one(poem)).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_one(poem)).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing create_many()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        let date = new Date() 
        let created_at = date
        let updated_at = date
        let intro1 = 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ1'
        let intro2 = 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ2'
        const poem1 = {
            intro: intro1,
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
        const poem2 = {
            intro: intro2,
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
        const success_inserts = [
            {_id, created_at, updated_at, ...poem1},
            {_id, created_at, updated_at, ...poem2},
        ]
        test("Success Test", async() => {
            vi.spyOn(repository, "create_many").mockResolvedValue(
                {
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Poem already exists"}]
                }
            )
            await expect(service.create_many([poem1, poem2, poem1])).resolves.toEqual({
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Poem already exists"}]
                }
            )
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_many").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_many([poem1, poem2, poem1])).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing update_one()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6";
        let verses = [
            "verse1",
            "verse2",
            "verse3",
            "verse4",
        ]
        let is_couplet= true
        let adeeb =  {_id}

        test("Success Test", async() => {
            vi.spyOn(repository, "update_one").mockResolvedValue(null)
            await expect(service.update_one(_id, {verses, is_couplet})).resolves.toEqual(null)
            vi.spyOn(repository, "update_one").mockResolvedValue(null)
            await expect(service.update_one(_id, {adeeb: adeeb._id})).resolves.toEqual(null)
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.update_one(_id, {})).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.update_one(_id, {})).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing delete_one()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6";
        test("Success Test", async() => {
            vi.spyOn(repository, "delete_one").mockResolvedValue(null)
            await expect(service.delete_one(_id)).resolves.toEqual(null)
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "delete_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.delete_one(_id)).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "delete_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.delete_one(_id)).rejects.toThrow(bad_req_err)
        })
    })
})