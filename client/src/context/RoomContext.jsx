// src/context/RoomContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import io from "socket.io-client";

const RoomContext = createContext();
let socket = null;
let isConnecting = false;

export const useRoom = () => useContext(RoomContext);

export const RoomProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]); // Room-level messages
  const [taskMessages, setTaskMessages] = useState({}); // Task-specific messages by taskId
  const [roomFiles, setRoomFiles] = useState([]); // Room-level files
  const [taskFiles, setTaskFiles] = useState({}); // Task-specific files by taskId

  const connectSocket = () => {
    if (socket && socket.connected) return socket;
    if (isConnecting) return null;

    const saved = localStorage.getItem("collabUser");
    if (!saved) return null;

    const { token } = JSON.parse(saved);
    isConnecting = true;

    const socketUrl = import.meta.env.VITE_API_URL ;
    socket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
      query: { token },
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      isConnecting = false;
    });
    
    socket.on("connect_error", (err) => {
      console.error("Socket error:", err);
      isConnecting = false;
    });

    // Real-time listeners
    socket.on("room-update", (updatedRoom) => {
      setRoom(updatedRoom);
      setMembers(updatedRoom.members.map(m => m.user));
    });

    socket.on("task-created", (task) => {
      setTasks(prev => [...prev, task]);
    });

    socket.on("task-updated", (task) => {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t));
    });

    socket.on("task-deleted", (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    socket.on("new-message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on("new-task-message", (msg) => {
      setTaskMessages(prev => ({
        ...prev,
        [msg.task]: [...(prev[msg.task] || []), msg]
      }));
    });

    socket.on("new-room-file", (fileData) => {
      setRoomFiles(prev => [...prev, fileData]);
    });

    socket.on("new-task-file", (fileData) => {
      setTaskFiles(prev => ({
        ...prev,
        [fileData.taskId]: [...(prev[fileData.taskId] || []), fileData]
      }));
    });

    return socket;
  };

  // Cleanup on app close
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    };
  }, []);

  return (
    <RoomContext.Provider value={{
      user, setUser,
      room, setRoom,
      members, setMembers,
      tasks, setTasks,
      messages, setMessages,
      taskMessages, setTaskMessages,
      roomFiles, setRoomFiles,
      taskFiles, setTaskFiles,
      socket, connectSocket
    }}>
      {children}
    </RoomContext.Provider>
  );
};
