// server/routes/taskRoutes.js
import express from "express";
import { createTask, getTasks, updateTask, deleteTask } from "../controllers/taskController.js";

const router = express.Router();

router.post("/create", createTask);
router.get("/room/:roomCode", getTasks);
router.put("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

export default router;