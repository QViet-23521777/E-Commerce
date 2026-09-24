import { Context, Next } from "hono";

// Headers the gateway itself stamps after verifying a JWT. A client must never
// be able to supply them: proxy.ts reads them back off the request object, so
// any route that skips `authenticate` would forward the client's own values
// to a service that trusts them unconditionally.
const GATEWAY_OWNED_HEADERS = [
  "x-user-id",
  "x-user-email",
  "x-user-role",
  "x-internal-secret",
];

export const stripIdentityHeaders = async (c: Context, next: Next) => {
  for (const header of GATEWAY_OWNED_HEADERS) {
    c.req.raw.headers.delete(header);
  }
  await next();
};
