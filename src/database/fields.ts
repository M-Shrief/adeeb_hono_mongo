/**
 * This module is used to contain shared schemas for Mongoose ORM,
 * we store the schema as an object, then we insert it using destructuring.
*/
import { Schema } from "mongoose"
import { randomUUID } from "node:crypto"

 

/**
 *  If you want to use UUID as _id
*/
export const uuid_schema = {
    type: Schema.Types.UUID,
    default: () => randomUUID()
}

export const verses_schema = {
    type: [String],
    maxLength: 256,
    required: true,
}

export const is_couplet_schema =  {
    type: Boolean,
    default: true
}

export const qoute_schema = {
    type: String,
    maxLength: 512,
    required: true,
}

export const verses_schema_optional = {
    type: [String],
    maxLength: 256,
    default: undefined,
}

export const is_couplet_schema_optional =  {
    type: Boolean,
    default: undefined,
}

export const qoute_schema_optional = {
    type: String,
    maxLength: 512,
    default: undefined,
}

export const tags_schema = {
    type: [String],
    maxLength: 64,
    default: []
}


export const reviewed_schema =  {
    type: Boolean,
    default: false
}

export const timestamps_schema = {
    createdAt: "created_at",
    updatedAt: "updated_at",
}

// Refs
export const adeeb_ref = { type: Schema.Types.UUID, ref: 'Adeeb', required: true };
export const poem_ref = { type: Schema.Types.UUID, ref: 'Poem', required: true };
export const poem_ref_optional = { type: Schema.Types.UUID, ref: 'Poem', default: undefined };
export const chosen_verse_ref_optional = { type: Schema.Types.UUID, ref: 'ChosenVerse', default: undefined };
export const prose_qoute_ref_optional = { type: Schema.Types.UUID, ref: 'ProseQoute', default: undefined };

export const user_ref_optional = { type: Schema.Types.UUID, ref: 'User', default: undefined };
export const order_ref = { type: Schema.Types.UUID, ref: 'Order', required: true };


