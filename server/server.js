// server/server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import "colors"; // This enables .green, .red, .cyan etc.
// Routes
import roomRoutes from "./routes/roomRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
// Models
import Room from "./models/Room.js";
import Task from "./models/Task.js";
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite default port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "CollabRoom API is running! 🚀" });
});

// MongoDB Connection with async/await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully".green.bold);
  } catch (error) {
    console.error("MongoDB Connection Failed:".red, error.message);
    process.exit(1); // Exit if DB fails
  }
};

// Call the async function
connectDB();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`.cyan);

  socket.on("join-room", async ({ roomCode }) => {
    socket.join(roomCode);
    console.log(`Socket ${socket.id} joined room: ${roomCode}`);
    
    // Send current room data to the joining user
    const room = await Room.findOne({ code: roomCode }).populate("members.user");
    if (room) {
      socket.emit("room-update", room);
    }
  });

  // Optional: allow client to request update
  socket.on("request-room-update", async ({ roomCode }) => {
    const room = await Room.findOne({ code: roomCode }).populate("members.user");
    if (room) {
      socket.emit("room-update", room);
    }
  });

  // Task collaboration events
  socket.on("join-task", ({ taskId, user }) => {
    socket.join(`task-${taskId}`);
    socket.to(`task-${taskId}`).emit("user-joined-task", { userId: user._id, userName: user.name });
    console.log(`User ${user.name} joined task ${taskId}`);
  });

  socket.on("leave-task", ({ taskId, userId }) => {
    socket.leave(`task-${taskId}`);
    socket.to(`task-${taskId}`).emit("user-left-task", { userId });
  });

  socket.on("task-content-change", ({ taskId, content, userId }) => {
    socket.to(`task-${taskId}`).emit("task-content-change", { content, userId });
  });

  socket.on("cursor-position", ({ taskId, userId, userName, position }) => {
    socket.to(`task-${taskId}`).emit("cursor-position", { userId, userName, position });
  });

  // Handle task deletion
  socket.on("task-delete", async ({ taskId }) => {
    try {
      const task = await Task.findById(taskId);
      if (!task) return;
      
      const room = await Room.findById(task.room);
      await task.deleteOne();
      
      // Emit to all room members
      io.to(room.code).emit("task-deleted", taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  });
});
// Make io accessible globally (for use in controllers later)
global.io = io;

const PORT = process.env.PORT|| 3000;

app.use("/api/rooms", roomRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`.blue.bold);
});
