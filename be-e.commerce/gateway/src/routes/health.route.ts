import { Hono } from "hono";
import { getHealth } from "../controller/health.controller";

const healthRoute = new Hono();

healthRoute.get("/", getHealth);

export default healthRoute;
