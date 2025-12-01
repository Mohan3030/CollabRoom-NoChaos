// server/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task" }, // for threaded chat
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);