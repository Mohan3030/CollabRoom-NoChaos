// server/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null but unique if exists
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=",
    },
    // For guest users (no login), we'll use session-based temp auth later
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);