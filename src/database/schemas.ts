import { Schema } from "mongoose";
// 
import {conn} from './index.js'
import { 
    is_couplet_schema, 
    adeeb_ref, 
    poem_ref, 
    qoute_schema,
    reviewed_schema, 
    tags_schema, 
    timestamps_schema, 
    uuid_schema, 
    verses_schema,
    user_ref_optional,
    order_ref,
    poem_ref_optional,
    chosen_verse_ref_optional,
    prose_qoute_ref_optional,
    is_couplet_schema_optional,
    qoute_schema_optional,
    verses_schema_optional
 } from "./fields.js";


export const TimePeriodEnum = {
    UNDEFINED : "غير محدد",
    JAHLI : "جاهلي",
    AMOEI : "أموي",
    ABASI : "عباسي",
    ANDALUSI : "أندلسي",
    TURKISH_ERA : "عثماني ومملوكي",
    MODERN : "حديث"
} as const

export const adeeb_schema = new Schema(
    {
        _id: uuid_schema,
        name: {
            type: String,
            maxLength: 128,
            unique: true,
            required: true,
        },
        bio: {
            type: String,
            maxLength: 1024,
            required: true,
        },
        time_period: {
            type: String,
            maxLength: 128,
            enum: {
                values: Object.values(TimePeriodEnum),
                // To assign error message:
                // message: '{VALUE} is not a valid TimePeriod'
            },
            required: true,
        },
        reviewed: reviewed_schema
    },
    {
        timestamps: timestamps_schema
    }
)

export const AdeebModel = conn.model("Adeeb", adeeb_schema)

export const poem_schema = new Schema(
    {
        _id: uuid_schema,
        intro: {
            type: String,
            maxLength: 256,
            unique: true,
            required: true,
        },
        verses: verses_schema,
        is_couplet: is_couplet_schema,
        reviewed: reviewed_schema,

        // Refs
        adeeb: adeeb_ref,
    },
    {
        timestamps: timestamps_schema
    }
)

export const PoemModel = conn.model("Poem", poem_schema)

export const chosen_verse_schema = new Schema(
    {
        _id: uuid_schema,
        tags: tags_schema,
        verses: verses_schema,
        is_couplet: is_couplet_schema,
        reviewed: reviewed_schema,

        // Refs
        adeeb: adeeb_ref,
        poem: poem_ref,
    },
    {
        timestamps: timestamps_schema
    }
)

export const ChosenVerseModel = conn.model("ChosenVerse", chosen_verse_schema)


export const prose_qoute_schema = new Schema(
    {
        _id: uuid_schema,
        tags: tags_schema,
        qoute: qoute_schema,
        source: {
            type: String,
            maxLength: 128,
            default: undefined,
        },
        reviewed: reviewed_schema,

        // Refs
        adeeb: adeeb_ref,
    },
    {
        timestamps: timestamps_schema
    }
)

export const ProseQouteModel = conn.model("ProseQoute", prose_qoute_schema)



export const RoleEnum = {
  NORMAL: "Normal",
  MANAGMENT: "Management",
  DBA: "DBA",
  ANALYTICS: "Analytics",
  BANNED: "Banned"
} as const

export const user_schema = new Schema(
    {
        _id: uuid_schema,
        username: {
            type: String,
            maxLength: 128,
            unique: true,
            required: true,
        },
        password: {
            type: String,
            maxLength: 256,
            required: true,
        },
        roles: {
            type: [String],
            enum: {
                values: Object.values(RoleEnum),
                // To assign error message:
                // message: '{VALUE} is not a valid TimePeriod'
            },
            validate: {
                validator: function(v: [string]) {
                    return v.length <= 6;
                },
            },
            required: true,
        },
    },
    {
        timestamps: timestamps_schema
    }
)

export const UserModel = conn.model("User", user_schema)

export const OrderStatusEnum = {
    IN_PROGRESS: "in progress",
    ABORTED: "aborted",
    COMPLETED: "completed",
} as const

export const order_schema = new Schema(
        {
        _id: uuid_schema,
        name: {
            type: String,
            maxLength: 128,
            required: true,
        },
        phone: {
            type: String,
            maxLength: 128,
            required: true,
        },
        address: {
            type: String,
            maxLength: 256,
            required: true,
        },
        delivery_schedule: {
            type: Date,
            default: undefined,
        },
        is_updateable: {
            type: Boolean,
            default: true
        },
        status: {
            type: String,
            enum: {
                values: Object.values(OrderStatusEnum),
                // To assign error message:
                // message: '{VALUE} is not a valid TimePeriod'
            },
            required: true,
        },
        reviewed: reviewed_schema,
 
        // Refs
        user: user_ref_optional,
    },
    {
        timestamps: timestamps_schema
    }
)

export const OrderModel = conn.model("Order", order_schema)

export const OutfitTypeEnum = {
    TSHIRT_7: "تيشيرت - لياقة 7",
    TSHIRT_HALF: "تيشيرت - نص لياقة ",
    TSHIRT_POLO: "تشيرت - لياقة بولو",
    JACKET: "جاكيت",
    SWEETSHIRT: "سويت شيرت",
    PULLOVER: "بلوفر",
} as const

export const print_schema = new Schema(
        {
        _id: uuid_schema,
        font_type: {
            type: String,
            maxLength: 64,
            required: true,
        },
        font_color: {
            type: String,
            maxLength: 64,
            required: true,
        },
        outfit_type: {
            type: String,
            enum: {
                values: Object.values(OutfitTypeEnum),
                // To assign error message:
                // message: '{VALUE} is not a valid TimePeriod'
            },
            required: true,
        },
        outfit_color: {
            type: String,
            maxLength: 64,
            required: true,
        },

        qoute: qoute_schema_optional,
        verses: verses_schema_optional,
        is_couplet: is_couplet_schema_optional,

        // Refs
        order: order_ref,
        user: user_ref_optional,

        poem: poem_ref_optional,
        chosen_verse: chosen_verse_ref_optional,
        prose_qoute: prose_qoute_ref_optional
    },
    {
        timestamps: timestamps_schema
    }
)

export const PrintModel = conn.model("Print", order_schema)
