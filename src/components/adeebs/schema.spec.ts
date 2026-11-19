import { describe, expect, it, vi, test, beforeAll } from 'vitest';
///////
import { safeParse } from 'valibot';
import { TimePeriodEnum } from '../../database/schemas.js';
import {create_many_req, create_one_req, get_one_res, update_req} from './schema.js'


describe.concurrent("Testing Adeebs' schema", async () => {
    const _id = "e7749f21-9cf9-4981-b7a8-2ce262f159f6"
    const create_one_adeeb_req = {
        name: 'عنترة بن شداد',
        time_period: TimePeriodEnum.JAHLI,
        bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
        reviewed: true
    }
    let poems = [
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
    ]
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
    let prose_qoutes = [
        {
            _id: '5bda8eea-8356-472e-ba96-4fdf7283422c',
            qoute: 'اشتريتُ الكتاب، وكان خسارةً، ولكن أين المفرُّ؟ فكلّ مُحِبٍّ للقراءة مثلي يُوقعه حبُّه مرارًا وتكرارًا في الخسارة بعد الخسارة، ثمّ لا يتوبُ! هكذا كُتُب زماننا..',
        },
    ]
    describe("Testing get_one_res schema", async () => {
        test("Testing success", async() => {
            let one_response = {
                _id,
                ...create_one_adeeb_req,
                poems,
                chosen_verses,
                prose_qoutes
            }
            const res = safeParse(get_one_res, one_response);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(one_response);  
        })
        test("Testing faliure", async() => {
            let one_response1 = {
                _id,
                ...create_one_adeeb_req,
                poems,
                chosen_verses,
            }
            const res1 = safeParse(get_one_res, one_response1);
            expect(res1.success).toEqual(false);
            let one_response2 = {
                _id,
                ...create_one_adeeb_req,
                poems,
                prose_qoutes
            }
            const res2 = safeParse(get_one_res, one_response2);
            expect(res2.success).toEqual(false);
            let one_response3= {
                _id,
                ...create_one_adeeb_req,
                chosen_verses,
                prose_qoutes
            }
            const res3 = safeParse(get_one_res, one_response1);
            expect(res3.success).toEqual(false);

        })
    })
    describe("Testing create_one_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_one_req, create_one_adeeb_req);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual(create_one_adeeb_req);  
        })
        test("Testing failure", async() => {
            const res1 = safeParse(create_one_req, {
                name: 125,
                time_period: TimePeriodEnum.JAHLI,
                bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_one_req, {
                name: 'عنترة بن شداد',
                time_period: "JAHLI",
                bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(create_one_req, {
                name: 'عنترة بن شداد',
                time_period: TimePeriodEnum.JAHLI,
                bio: [1,2]
            });
            expect(res3.success).toEqual(false);

        })
    })
    describe("Testing create_many_req schema", async () => {
        test("Testing success", async() => {
            const res = safeParse(create_many_req, [create_one_adeeb_req,create_one_adeeb_req]);
            expect(res.success).toEqual(true);
            expect(res.output).toEqual([create_one_adeeb_req,create_one_adeeb_req]);  
        })        
        test("Testing failure", async() => {
            const res1 = safeParse(create_many_req, [
                {
                    name: 125,
                    time_period: TimePeriodEnum.JAHLI,
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                },
                {
                    name: 125,
                    time_period: TimePeriodEnum.JAHLI,
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                },
                {
                    name: 125,
                    time_period: TimePeriodEnum.JAHLI,
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                }
            ]);
            expect(res1.success).toEqual(false);
            const res2 = safeParse(create_many_req, [
                {
                    name: 'عنترة بن شداد',
                    time_period: "AHLI",
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                },
                {
                    name: 'عنترة بن شداد',
                    time_period: "AHLI",
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                },
                {
                    name: 'عنترة بن شداد',
                   time_period: "AHLI",
                    bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
                }
            ]);
            expect(res2.success).toEqual(false);
            const res3 = safeParse(create_many_req, [
                {
                    name: 'عنترة بن شداد',
                    time_period: "AHLI",
                    bio: [1,2]
                },
                {
                    name: 'عنترة بن شداد',
                    time_period: "AHLI",
                    bio: [1,2]
                },
                {
                    name: 'عنترة بن شداد',
                    time_period: "AHLI",
                    bio: [1,2]
                }
            ]);
            expect(res3.success).toEqual(false);

        })
    })
    describe("Testing update_req schema", async () => {
        test("Testing success", async() => {
            const res1 = safeParse(update_req, {
                time_period: TimePeriodEnum.JAHLI,
                bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            });
            expect(res1.success).toEqual(true);
            const res2 = safeParse(update_req, {
                name: 'عنترة بن شداد',
                bio: 'عنترة بن عمرو بن شداد بن معاوية بن قراد العبسي (525 م - 608 م) هو أحد أشهر شعراء العرب في فترة ما قبل الإسلام، اشتهر بشعر الفروسية، وله معلقة مشهورة. وهو أشهر فرسان العرب وأشعرهم وشاعر المعلقات والمعروف بشعره الجميل وغزله العفيف بعبلة.',
            });
            expect(res2.success).toEqual(true);
            const res3 = safeParse(update_req, {
                name: 'عنترة بن شداد',
                time_period: TimePeriodEnum.JAHLI,
            });
            expect(res3.success).toEqual(true);
        })
        test("Testing failure", async() => {
            const res1 = safeParse(update_req, {
                name: 125,
            });
            expect(res1.success).toEqual(false);
            const res2 = safeParse(update_req, {
                time_period: "JAHLI",
            });
            expect(res2.success).toEqual(false);
            const res3 = safeParse(update_req, {
                bio: [1,2]
            });
            expect(res3.success).toEqual(false);

        })
    })
})