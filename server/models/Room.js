// server/models/Room.js
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, unique: true, uppercase: true, trim: true },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate unique 6-char code
roomSchema.pre("save", async function () {
  if (!this.code) {
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existing = await this.constructor.findOne({ code });
      if (!existing) isUnique = true;
    }
    this.code = code;
  }
});

export default mongoose.model("Room", roomSchema);