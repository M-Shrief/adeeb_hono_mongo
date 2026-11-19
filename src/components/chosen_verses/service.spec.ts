import { describe, expect, it, vi, test, beforeAll } from 'vitest';
////
import { service } from './service.js';
import { repository } from './repository.js';
import { APIError } from '../../utils/errors.js';
import { HttpStatusCode } from '../../utils/api.js';
import { TimePeriodEnum } from '../../database/schemas.js';


describe.concurrent("Testing ChosenVerse' service", async () => {
    describe("Testing get_all()", async () => {
        const _id = '0343952d-58fc-4f56-b2b6-fc04731de5ce';
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        const poem = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
        }
        let chosen_verse = {
            _id,
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb._id,
            poem: poem._id
        }
        let get_data_result = {
            data: [chosen_verse, chosen_verse],
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
        const _id = '0343952d-58fc-4f56-b2b6-fc04731de5ce';
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        const poem = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
        }
        let chosen_verse = {
            _id,
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb._id,
            poem: poem._id,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "get_one_by_id").mockResolvedValue(chosen_verse as any)
            await expect(service.get_one_by_id(_id)).resolves.toEqual(chosen_verse)
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
        const poem = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
        }
        let date = new Date() 
        let created_at = date
        let updated_at = date
        const chosen_verse = {
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb._id,
            poem: poem._id,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "create_one").mockResolvedValue({_id, created_at, updated_at, ...chosen_verse} as any)
            await expect(service.create_one(chosen_verse)).resolves.toEqual({_id, created_at, updated_at, ...chosen_verse})
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.create_one(chosen_verse)).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_one(chosen_verse)).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing create_many()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb1 = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        const adeeb2 = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce282f159f6",
            name: 'عنترة بن شداد',
        }
        const poem = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
        }
        let date = new Date() 
        let created_at = date
        let updated_at = date
        const chosen_verse1 = {
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb1._id,
            poem: poem._id,
        }
        const chosen_verse2 = {
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb2._id,
            poem: poem._id,
        }
        const chosen_verse3 = {
            verses: [
                "verse1",
                "verse2",
                "verse3",
                "verse4",
            ],
            is_couplet: true,
            tags: ["tag1", "tag2"],
            reviewed: true,
            adeeb: adeeb2._id,
            poem: poem._id,
        }
        const success_inserts = [
            {_id, created_at, updated_at, ...chosen_verse1},
            {_id, created_at, updated_at, ...chosen_verse2},
        ]
        test("Success Test", async() => {
            vi.spyOn(repository, "create_many").mockResolvedValue(
                {
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Foreign Key Error"}]
                }
            )
            await expect(service.create_many([chosen_verse1, chosen_verse2])).resolves.toEqual({
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Foreign Key Error"}]
                }
            )
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_many").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_many([chosen_verse1, chosen_verse2, chosen_verse1])).rejects.toThrow(bad_req_err)
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
        let poem =  {_id}

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