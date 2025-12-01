import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);