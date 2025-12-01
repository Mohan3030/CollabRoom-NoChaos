// server/controllers/roomController.js
import Room from "../models/Room.js";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";

// @desc    Create new room
// server/controllers/roomController.js

// 1. Create Room (anyone with name can create)
export const createRoom = async (req, res) => {
  try {
    const { roomName, userName } = req.body;

    if (!roomName || !userName) {
      return res.status(400).json({ message: "Room name and your name required" });
    }

    // Create or find user
    let user = await User.findOne({ name: userName });
    if (!user) {
      user = await User.create({
        name: userName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
      });
    }

    // Create room
    const room = await Room.create({
      name: roomName,
      creator: user._id,
      members: [{ user: user._id, role: "admin" }],
    });

    await room.populate("members.user");
    
    // Get all user's rooms
    const userRooms = await Room.find({ "members.user": user._id }).select("name code");
    
    global.io.to(room.code).emit("room-update", room);
    global.io.emit("room-list-update");
    res.status(201).json({
      room,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
      rooms: userRooms,
      token: generateToken(user._id),
    });  
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Join Room by Code
export const joinRoom = async (req, res) => {
  try {
    const { roomCode, userName } = req.body;

    if (!roomCode || !userName) {
      return res.status(400).json({ message: "Room code and name required" });
    }

    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Invalid room code" });

    let user = await User.findOne({ name: userName });
    if (!user) {
      user = await User.create({
        name: userName,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`,
      });
    }

    const alreadyMember = room.members.some(m => m.user.toString() === user._id.toString());
    if (!alreadyMember) {
      room.members.push({ user: user._id });
      await room.save();
    }

    await room.populate("members.user");
    
    // Get all user's rooms
    const userRooms = await Room.find({ "members.user": user._id }).select("name code");
    
    global.io.to(room.code).emit("room-update", room);
    global.io.emit("room-list-update");
    res.status(200).json({
      room,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
      rooms: userRooms,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Leave Room
export const leaveRoom = async (req, res) => {
  try {
    const { roomCode, userId } = req.body;

    if (!roomCode || !userId) {
      return res.status(400).json({ message: "Room code and user ID required" });
    }

    const room = await Room.findOne({ code: roomCode.toUpperCase() });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Remove user from room members only
    room.members = room.members.filter(m => m.user.toString() !== userId);
    await room.save();
    await room.populate("members.user");

    // Emit update to all room members
    global.io.to(room.code).emit("room-update", room);

    // Get remaining user's rooms
    const userRooms = await Room.find({ "members.user": userId }).select("name code");

    res.status(200).json({
      message: "Left room successfully",
      rooms: userRooms
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
