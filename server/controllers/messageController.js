// server/controllers/messageController.js
import Message from "../models/Message.js";
import Room from "../models/Room.js";

// Get Messages for Room (only room-level messages, not task messages)
export const getMessages = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Only get messages that are NOT associated with a task
    const messages = await Message.find({ 
      room: room._id,
      task: null // Only room-level messages
    })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Messages for a specific Task
export const getTaskMessages = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get messages that are associated with this specific task
    const messages = await Message.find({ 
      task: taskId
    })
      .populate("user", "name avatar")
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { roomCode, userId, content, taskId } = req.body;

    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const message = await Message.create({
      room: room._id,
      user: userId,
      content,
      task: taskId || null,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("user", "name avatar");

    // Emit different events for room messages vs task messages
    if (taskId) {
      // Task-specific message - emit to task room
      global.io.to(`task-${taskId}`).emit("new-task-message", populatedMessage);
    } else {
      // General room message - emit to room
      global.io.to(room.code).emit("new-message", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};