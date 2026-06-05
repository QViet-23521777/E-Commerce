import { Hono } from "hono";
import { checkActionPermission } from "../controllers/action.permision.controller";

const actionPermission = new Hono();

actionPermission.post("/check", checkActionPermission);

export default actionPermission;
