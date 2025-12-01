// server/models/Task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["todo", "doing", "done"],
      default: "todo",
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);