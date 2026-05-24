import { Context } from "hono";
import { getHealthStatus } from "../services/health-monitor.service";

export const getHealth = (c: Context) => {
  return c.json(getHealthStatus());
};
