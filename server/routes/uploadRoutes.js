import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
import Room from '../models/Room.js';
import File from '../models/File.js';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { roomCode, userName, taskId } = req.body;
    const file = req.file;

    if (!file || !roomCode || !userName) {
      return res.status(400).json({ message: 'File, roomCode, and userName required' });
    }

    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Organize files in specific folders
    const folder = taskId 
      ? `collabroom/rooms/${roomCode}/tasks/${taskId}` 
      : `collabroom/rooms/${roomCode}`;

    // Upload to Cloudinary with public access
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'auto',
          public_id: `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`,
          access_mode: 'public'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(file.buffer);
    });

    const fileUrl = result.secure_url;

    // Save file to database
    const savedFile = await File.create({
      room: room._id,
      task: taskId || null,
      fileName: file.originalname,
      url: fileUrl,
      public_id: result.public_id,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedBy: userName
    });

    const fileData = {
      _id: savedFile._id,
      url: fileUrl,
      public_id: result.public_id,
      fileName: file.originalname,
      uploadedBy: userName,
      uploadedAt: savedFile.createdAt,
      fileType: file.mimetype,
      fileSize: file.size,
      taskId: taskId || null
    };

    // Emit to appropriate room
    if (taskId) {
      global.io.to(`task-${taskId}`).emit('new-task-file', fileData);
    } else {
      global.io.to(room.code).emit('new-room-file', fileData);
    }

    res.json({ success: true, file: fileData });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Get files for room
router.get('/room/:roomCode', async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const files = await File.find({ 
      room: room._id, 
      task: null 
    }).sort({ createdAt: 1 });
    
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get files for task
router.get('/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const files = await File.find({ task: taskId }).sort({ createdAt: 1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;