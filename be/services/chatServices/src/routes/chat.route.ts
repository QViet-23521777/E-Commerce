import { Hono } from "hono";
import {
  listConversationsController,
  sendMessageController,
  listMessagesController,
  markReadController,
} from "../controllers/chat.controller";

const chatRoutes = new Hono();

chatRoutes.get("/conversations", listConversationsController);
chatRoutes.get("/conversations/:id/messages", listMessagesController);
chatRoutes.post("/conversations/:id/read", markReadController);
chatRoutes.post("/messages", sendMessageController);

export default chatRoutes;
