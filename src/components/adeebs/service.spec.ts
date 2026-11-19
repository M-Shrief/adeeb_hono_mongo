import { describe, expect, it, vi, test, beforeAll } from 'vitest';
////
import { service } from './service.js';
import { repository } from './repository.js';
import { APIError } from '../../utils/errors.js';
import { HttpStatusCode } from '../../utils/api.js';
import { TimePeriodEnum } from '../../database/schemas.js';


describe.concurrent("Testing Adeebs' service", async () => {
    describe("Testing get_all()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        const adeeb = {
        _id: _id,
        name: 'عنترة بن شداد',
        time_period: TimePeriodEnum.JAHLI,
        bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
        reviewed: true,
        }
        let get_data_result = {
            data: [adeeb, adeeb],
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
        _id: _id,
        name: 'عنترة بن شداد',
        time_period: TimePeriodEnum.JAHLI,
        bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
        reviewed: true,
        poems: [
            {
            _id: '0343952d-58fc-4f56-b2b6-fc04731de5ce',
            intro: 'حَكِّم سُيوفَكَ في رِقابِ العُذَّلِ',
            },
            {
            _id: 'f3ac040d-3402-41ee-9cdc-7c141558668d',
            intro: 'testing89',
            },
            {
            _id: '13857487-5a74-424d-aab2-deb5aa79127d',
            intro: 'testing3',
            },
        ],
        chosen_verses: [
            {
            _id: '116d9b44-2a7b-4739-9014-d19a7677dd72',
            tags: 'الفخر',
            verses: [
                'فَكَأَنَّما برقعت وَجه نَهاري',
                'لا ذَنبَ لي كَم رمت كتم فَضائِلي',
            ],
            is_couplet: true,
            },
        ],
        prose_qoutes: [
            {
            _id: '5bda8eea-8356-472e-ba96-4fdf7283422c',
            qoute: 'اشتريتُ الكتاب، وكان خسارةً، ولكن أين المفرُّ؟ فكلّ مُحِبٍّ للقراءة مثلي يُوقعه حبُّه مرارًا وتكرارًا في الخسارة بعد الخسارة، ثمّ لا يتوبُ! هكذا كُتُب زماننا..',
            },
        ],
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "get_one_by_id").mockResolvedValue(adeeb as any)
            await expect(service.get_one_by_id(_id)).resolves.toEqual(adeeb)
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
        let date = new Date() 
        let created_at = date
        let updated_at = date
        const adeeb = {
            name: 'عنترة بن شداد',
            time_period: TimePeriodEnum.JAHLI,
            bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            reviewed: true,
        }
        test("Success Test", async() => {
            vi.spyOn(repository, "create_one").mockResolvedValue({_id, created_at, updated_at, ...adeeb} as any)
            await expect(service.create_one(adeeb)).resolves.toEqual({_id, created_at, updated_at, ...adeeb})
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.create_one(adeeb)).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_one(adeeb)).rejects.toThrow(bad_req_err)
        })
    })
    describe("Testing create_many()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
        let date = new Date() 
        let created_at = date
        let updated_at = date
        let name1 = '1عنترة بن شداد'
        let name2 = '2عنترة بن شداد'
        const adeeb1 = {
            name: name1,
            time_period: TimePeriodEnum.JAHLI,
            bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            reviewed: true,
        }
        const adeeb2 = {
            name: name1,
            time_period: TimePeriodEnum.JAHLI,
            bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            reviewed: true,
        }
        const success_inserts = [
            {_id, created_at, updated_at, ...adeeb1},
            {_id, created_at, updated_at, ...adeeb2},
        ]
        test("Success Test", async() => {
            vi.spyOn(repository, "create_many").mockResolvedValue(
                {
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Adeeb already exists"}]
                }
            )
            await expect(service.create_many([adeeb1, adeeb2, adeeb1])).resolves.toEqual({
                    created_items: success_inserts, 
                    success_count: 2, 
                    invalid_items: [{item_index: 2, message: "Adeeb already exists"}]
                }
            )
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "create_many").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.create_many([adeeb1, adeeb2, adeeb1])).rejects.toThrow(bad_req_err)
        })
    })
    describe("Testing update_one()", async () => {
        const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6";
        const name = 'عنترة بن شداد';
        const time_period = TimePeriodEnum.JAHLI;
        test("Success Test", async() => {
            vi.spyOn(repository, "update_one").mockResolvedValue(null)
            await expect(service.update_one(_id, {name, time_period})).resolves.toEqual(null)
        })

        test("Fail Test: APIError=409", async() => {
            const conflict_err = new APIError(HttpStatusCode.CONFLICT, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.CONFLICT, "repository"))
            await expect(service.update_one(_id, {name})).rejects.toThrow(conflict_err)
        })
        test("Fail Test: APIError=400", async() => {
            const bad_req_err = new APIError(HttpStatusCode.BAD_REQUEST, "repository")
            vi.spyOn(repository, "update_one").mockThrow(new APIError(HttpStatusCode.BAD_REQUEST, "repository"))
            await expect(service.update_one(_id, {name})).rejects.toThrow(bad_req_err)
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