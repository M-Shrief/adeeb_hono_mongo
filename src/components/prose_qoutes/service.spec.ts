import { describe, expect, it, vi, test, beforeAll } from 'vitest';
////
import { service } from './service.js';
import { repository } from './repository.js';
import { APIError } from '../../utils/errors.js';
import { HttpStatusCode } from '../../utils/api.js';
import { TimePeriodEnum } from '../../database/schemas.js';


describe.concurrent("Testing ProseQoutes' service", async () => {
    describe("Testing get_all()", async () => {
        const _id = '0343952d-58fc-4f56-b2b6-fc04731de5ce';
        const adeeb = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        let prose_qoute = {
            _id,
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a",
            source: null,
            reviewed: true,
            adeeb: adeeb._id
        }
        let get_data_result = {
            data: [prose_qoute, prose_qoute],
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
        let prose_qoute = {
            _id,
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a",
            source: null,
            reviewed: true,
            adeeb,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "get_one_by_id").mockResolvedValue(prose_qoute as any)
            await expect(service.get_one_by_id(_id)).resolves.toEqual(prose_qoute)
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
        const prose_qoute = {
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a",
            source: null,
            reviewed: true,
            adeeb: adeeb._id,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "create_one").mockResolvedValue({_id, created_at, updated_at, ...prose_qoute} as any)
            await expect(service.create_one(prose_qoute)).resolves.toEqual({_id, created_at, updated_at, ...prose_qoute})
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.create_one(prose_qoute)).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_one(prose_qoute)).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing create_many()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb1 = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce292f159f6",
            name: 'عنترة بن شداد',
        }
        const adeeb2 = {
            _id: "e7749f21-9cf9-4981-b7a8-2ce262f159f6",
            name: 'عنترة بن شداد',
        }
        let date = new Date() 
        let created_at = date
        let updated_at = date
        let intro1 = 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ1'
        let intro2 = 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ2'
        const prose_qoute1 = {
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a1",
            source: null,
            reviewed: true,
            adeeb: adeeb1._id,
        }
        const prose_qoute2 = {
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a2",
            source: null,
            reviewed: true,
            adeeb: adeeb1._id,
        }
        const prose_qoute3 = {
            tags: ["tag1", "tag2"],
            qoute: "Qoutesgasg a2",
            source: null,
            reviewed: true,
            adeeb: adeeb2._id,
        }

        const success_inserts = [
            {_id, created_at, updated_at, ...prose_qoute1},
            {_id, created_at, updated_at, ...prose_qoute2},
        ]
        test("Success Test", async() => {
            vi.spyOn(repository, "create_many").mockResolvedValue(
                {
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Foreign Key Error"}]
                }
            )
            await expect(service.create_many([prose_qoute1, prose_qoute2, prose_qoute3])).resolves.toEqual({
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Foreign Key Error"}]
                }
            )
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_many").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_many([prose_qoute1, prose_qoute2, prose_qoute1])).rejects.toThrow(bad_req_err)
        })
    })

    describe("Testing update_one()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6";
        let tags = ["tag1", "tag2"]
        let qoute = "Qoutesgasg a"
        let source: null = null
        let reviewed = true
        let adeeb = {_id}
        test("Success Test", async() => {
            vi.spyOn(repository, "update_one").mockResolvedValue(null)
            await expect(service.update_one(_id, {qoute, source})).resolves.toEqual(null)
            vi.spyOn(repository, "update_one").mockResolvedValue(null)
            await expect(service.update_one(_id, {adeeb: adeeb._id})).resolves.toEqual(null)
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.update_one(_id, {qoute})).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.update_one(_id, {source})).rejects.toThrow(bad_req_err)
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