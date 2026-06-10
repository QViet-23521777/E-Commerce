import { Hono } from "hono";
import { checkActionPermission } from "../controllers/action.permission.controller";

const actionPermission = new Hono();

actionPermission.post("/check", checkActionPermission);

export default actionPermission;
