// server/routes/messageRoutes.js
import express from "express";
import { sendMessage, getMessages, getTaskMessages } from "../controllers/messageController.js";

const router = express.Router();
router.post("/", sendMessage);
router.get("/room/:roomCode", getMessages); // Room-level messages only
router.get("/task/:taskId", getTaskMessages); // Task-specific messages only

export default router;