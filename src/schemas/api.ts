import { array, maxValue, minValue, number, object, optional, pipe, string } from "valibot";
/////////////


/**
 * A basic schema for responses, which only contain a message.
 */
export const base_response_schema = object({message: string()})

/**
 * Queries' schema which is used to get all items for a route
 */
export const queries_schema_for_get_all_req = object({
  limit: optional(pipe(number(), minValue(0), maxValue(100)), 100),
  offset: optional(pipe(number(), minValue(0)), 0)
})

/**
 * Shared schema for requests to get all items for a route.
 * @param item_schema schema for a single item
 */
export function get_all_schema(item_schema: any) {
  return object({
    data: array(item_schema),
    limit: number(),
    offset: number(),
    total_count: number(),
  })
}
