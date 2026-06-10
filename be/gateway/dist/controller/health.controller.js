"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = void 0;
const health_monitor_service_1 = require("../services/health-monitor.service");
const getHealth = (c) => {
    return c.json((0, health_monitor_service_1.getHealthStatus)());
};
exports.getHealth = getHealth;
