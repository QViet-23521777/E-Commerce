"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const health_controller_1 = require("../controller/health.controller");
const healthRoute = new hono_1.Hono();
healthRoute.get("/", health_controller_1.getHealth);
exports.default = healthRoute;
