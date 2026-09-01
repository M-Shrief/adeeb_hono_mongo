import {
  validator as vValidator,

} from "hono-openapi";
import {  object } from 'valibot';
///
import { HttpStatusCode } from "./api.js"
import { uuid_schema } from "../schemas/general.js"
import { auth_header_schema } from "./auth.js";


/**
 * It takes errors of type StandardSchemaV1.Issue[], but we can't import it so we type it as any[]
 * we only return the error's message & path fields. * 
 * @param errors
 * @returns 
 */
const format_errors = (errors: readonly any[]) => {
  return errors.map((e: any) => { return {message: e.message, path: e.path} })
}

export const json_validator = (schema: any, message?: string, show_errors: boolean = true) => {
  return vValidator('json', schema, (result, c) => {
    if(!result.success) { 
      if(show_errors) {
        return c.json(
          {
            message: message ?? "Invalid data",
            errors: format_errors(result.error)
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        )
      } else {
        return c.json(
          {
            message: message ?? "Invalid data",
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        )
      }
    }        
  })
}

export const param_validator = (schema: any, message?: string, show_errors: boolean = true) =>
  vValidator('param', schema, (result, c) => {
    if (!result.success) {
      if(show_errors) {
        return c.json(
          {
            message: message ?? 'param validation error',
            errors: format_errors(result.error)
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        );
      } else {
        return c.json(
          {
            message: message ?? 'param validation error',
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        );
      }
    }
  });

export const query_validator = (schema: any, message?: string, show_errors: boolean = true) =>
  vValidator("query", schema, (result, c) => {
    if (!result.success) {
      if (show_errors) {
        return c.json(
          {
            message: message ?? 'query validation error',
            errors: format_errors(result.error)
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        );
      } else {
        return c.json(
          {
            message: message ?? 'query validation error',
          },
          HttpStatusCode.UNPROCESSABLE_ENTITY,
        );
      }
    }
  });


export const id_param_validator = () =>
  param_validator(object({ id: uuid_schema }), 'Invalid id');

/**
 * 
 * @param schema header name must be lowercase
 * @param message 
 * @returns 
 */
export function header_validator(schema: any, message?: string, show_errors: boolean = true) {
  return vValidator("header", schema, (result, c) => {
    if (!result.success) {
      if (show_errors) {
        return c.json(
          {
            message: message ?? 'query validation error',
            errors: format_errors(result.error)
          },
          HttpStatusCode.UNAUTHORIZED,
        );
      } else {
        return c.json(
          {
            message: message ?? 'query validation error',
          },
          HttpStatusCode.UNAUTHORIZED,
        );
      }
    }
  });
}

export const auth_header_validator = () =>
  header_validator(auth_header_schema, "Not Authorized", false)