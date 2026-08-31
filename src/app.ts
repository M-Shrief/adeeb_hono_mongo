import { Hono } from "hono";
import {
  describeRoute,
  openAPIRouteHandler
} from "hono-openapi";
import * as v from "valibot";
import { Scalar } from '@scalar/hono-api-reference'
// Middlewares
import { structuredLogger } from '@hono/structured-logger';
import { secureHeaders } from 'hono/secure-headers';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { rateLimiter } from "hono-rate-limiter";
import { trimTrailingSlash } from 'hono/trailing-slash'
import { bodyLimit } from 'hono/body-limit'
import { timeout } from 'hono/timeout'
// utils
import  {logger} from "./utils/logger.js"
import { base_response_schema} from './schemas/api.js' 
import { HttpStatusCode, get_described_route } from "./utils/api.js"
// Components
import { adeeb_route } from "./components/adeebs/route.js";
import { poem_route } from "./components/poems/route.js";
import { chosen_verses_route } from "./components/chosen_verses/route.js";
import { prose_qoute_route } from "./components/prose_qoutes/route.js";
import { users_route } from "./components/users/route.js";
import { orders_route } from "./components/orders/route.js";

const app = new Hono();



app.use(
  structuredLogger({
    createLogger: () => logger,
  })
)
app.use(trimTrailingSlash()) // set standard to trim trailing slash to all requests
app.use(secureHeaders());
app.use(cors());
app.use(
  bodyLimit({
    maxSize: 1000 * 1024, // 1MB
    onError: (c) => {
      return c.text('payload overflow', HttpStatusCode.PAYLOAD_TOO_LARGE)
    },
  })
)
app.use(compress());
// Apply rate limiting middleware globally, and will apply it surgically later to each route.
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 1000, // Limit each client to 100 requests per window
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "", // Use IP address as key
  })
);


app.get(
  '/', 
  describeRoute({
    summary: "Index metadata",
    responses: {
      ...get_described_route(
          HttpStatusCode.OK,
          "Successful  response",
          v.object({
            title: v.string(),
            description: v.string(),
            version: v.string(),
            docs: v.string(),
            openapi: v.string()
          })
        )
    },
  }),
  (c) => {
  var project_metadata = {
    title: "Adeeb Hono",
    description: "Adeeb's Backend iteration in JS & TS, using Hono",
    version: "0.1.0",
    docs: "/docs",
    openapi: "/openapi.json"
  }
  c.status(200)
  return c.json(project_metadata);
});

app.get(
  '/ping', 
  describeRoute({
    summary: "Ping",
    responses: {
      ...get_described_route(HttpStatusCode.OK, "Pinged",base_response_schema),
    },
  }),
  async (c) => {
  c.status(200)
  return c.json({message: 'pong'});
});



app.get(
  "/openapi.json",
  describeRoute({
    summary: "OpenAPI",
    responses: {
      200: {
        description: "Get OpenAPI spec",
      },
    },
  }),
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "Adeeb Hono",
        description: "Adeeb's Backend iteration in JS & TS, using Hono",
        version: "0.1.0",
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      }
    },
    includeEmptyPaths: true
  }),
);

app.get(
  '/docs',
  describeRoute({
    summary: "Scalar Docs",
    responses: {
      200: {
        description: "Scalar docs",
      },
    },
  }),
  Scalar({
    title: "Adeeb Hono",
    url:   "/openapi.json",
    // theme: 'purple',
    darkMode: true
  })
)

// Add timeout for api's routes, default time out is 5 seconds
app.use('/api/*', timeout(5000))

app.route("/api/v1", adeeb_route)
app.route("/api/v1", poem_route)
app.route("/api/v1", chosen_verses_route)
app.route("/api/v1", prose_qoute_route)
app.route("/api/v1", users_route)
app.route("/api/v1", orders_route)



export { app }
