import { HttpStatusCode } from "./api.js";

/**
 * It's used to act on the process's unhandledRejection & uncaughtException Events
 * 
 * Used in top of the entry point,
 * before any function that raises exceptions.
 */
export function on_process_failure() {
  process.on('unhandledRejection', (error: Error) => {
    console.error("unhandledRejection", error.message)
    throw error;
  });

  process.on('uncaughtException', async (error: Error) => {
    console.error("uncaughtException", error.message)
    process.exit(1);
  });
}


export type CausedIn = "controller" | "service" | "repository" | "middleware" | "internal"

/**
 * A custom error used to used in API components,
 * make sure to specify the HTTP status code
 */
export class APIError extends Error {
  constructor(
    public readonly status_code: HttpStatusCode,
    // public readonly endpoint: string,
    public readonly caused_in: CausedIn,
    message: string = "API Error",
  ) {
    super(message);
    this.name = "APIError";
    // Restore the prototype chain (required when extending built-in classes)
    Object.setPrototypeOf(this, APIError.prototype);
    Error.captureStackTrace(this);
  }  
}


// // centralized error object that derives from Node’s Error
// // used like:     throw new AppError(ResourceNotFound, HTTPErrors.NotFound, 'further explanation', true)
// export class AppError extends Error {
//   public readonly name: string;
//   public readonly httpCode: HttpCode;
//   public readonly isOperational: boolean;

//   constructor(name: string, httpCode: HttpCode, description: string, isOperational: boolean) {
//     super(description);

//     Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain

//     this.name = name;
//     this.httpCode = httpCode;
//     this.isOperational = isOperational;

//     Error.captureStackTrace(this);
//   }
// }
