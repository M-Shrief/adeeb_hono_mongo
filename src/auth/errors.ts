import { Context } from "hono";
/////////
import { HttpStatusCode } from "../utils/api.js";
import { APIError, CausedIn } from "../utils/errors.js";
import { object, string, enum as enum_schema } from "valibot";

export class AuthError extends APIError {
  constructor(
    public readonly reason: AuthError_ReasonEnumType = AuthError_ReasonEnum.UNKNOWN,
    public readonly caused_in: CausedIn,
    message: string = "Auth Error",
  ) {
    super(HttpStatusCode.UNAUTHORIZED, caused_in, message);
    this.name = "AuthError";
    // Restore the prototype chain (required when extending built-in classes)
    Object.setPrototypeOf(this, AuthError.prototype);
    Error.captureStackTrace(this);
  }  
}

export type AuthError_ReasonEnumType = typeof AuthError_ReasonEnum[keyof typeof AuthError_ReasonEnum];

export const AuthError_ReasonEnum = {
  // token-specific
  HEADER : "Authorization header doesn't exist",
  INVALID_TOKEN : "Token is invalid",
  INVALID_CLAIMS : "Token's claims are invalid.",
  EXPIRED : "Token is expired",
  USED : "Refresh Token has already been used",
  BANNED : "Token has been banned",
  IMMATURE : "Token's claims are immature, not logical",
  UNKNOWN : "Unkown error, try logging in again.",
  // user-specific
  PERM : "User doesn't have the required permission",
  INVALID_PASS : "Passwords is incorrect",
} as const



export function new_auth_error_response(c: Context, reason: AuthError_ReasonEnumType) {
  return c.json({ message: "Not Authorized", reason: reason}, HttpStatusCode.UNAUTHORIZED) 
}

/**
 * A basic schema for responses, which only contain a message.
 */
export const auth_error_response_schema = object({message: string(), reason: enum_schema(AuthError_ReasonEnum)})
