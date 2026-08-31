import {
    pipe,
    string,
    uuid,
    optional,
    number,
    object,
    array,
    boolean,
    fallback,
    maxLength,
    minLength,
    trim,
    date
} from 'valibot';


export const uuid_schema = pipe(string(), uuid());

export const reviewed_schema = fallback(boolean(), false);

export const verses_schema = array(pipe(string(), trim(), minLength(4), maxLength(256)))

export const is_couplet_schema = fallback(boolean(), true) 

export const tags_schema = array(pipe(string(), trim(), minLength(3), maxLength(64)))

export const qoute_schema = pipe(string(), trim(), minLength(4), maxLength(512));

const date_schema = date()

export const created_at = date_schema
export const updated_at = date_schema

export const invalid_item = object({
  item_index: number(),
  message: string(),
})