// server/controllers/taskController.js
import Task from "../models/Task.js";
import Room from "../models/Room.js";

// Get Tasks for Room
export const getTasks = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const tasks = await Task.find({ room: room._id }).populate("assignee");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Task
export const createTask = async (req, res) => {
  try {
    const { roomCode, title, description, assignee } = req.body;
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const task = await Task.create({
      room: room._id,
      title,
      description,
      assignee: assignee || null
    });

    const populatedTask = await Task.findById(task._id).populate("assignee");

    // Emit to room
    global.io.to(room.code).emit("task-created", populatedTask);

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task (status, assignee, order)
export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const updates = req.body;

    const task = await Task.findByIdAndUpdate(taskId, updates, { new: true })
      .populate("assignee");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const room = await Room.findById(task.room);
    global.io.to(room.code).emit("task-updated", task);

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const room = await Room.findById(task.room);
    await task.deleteOne();

    // Emit real-time deletion to all room members
    global.io.to(room.code).emit("task-deleted", taskId);

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
