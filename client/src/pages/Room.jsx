// src/pages/Room.jsx
import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import API_URL from "../utils/api";
import MemberList from "../components/MemberList";
import RoomsList from "../components/RoomsList";
import TaskBoard from "../components/TaskBoard";
import Chat from "../components/Chat";
import MembersDropdown from "../components/MembersDropdown";

export default function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const prevCodeRef = useRef(null);
  const {
    user, setUser,
    room, setRoom,
    connectSocket,
    setMembers,
    setTasks,
    setMessages,
    setRoomFiles,
    socket
  } = useRoom();

  const fetchRoomFiles = async (roomCode) => {
    try {
      const response = await fetch(`${API_URL}/api/upload/room/${roomCode}`);
      if (response.ok) {
        const files = await response.json();
        setRoomFiles(files);
      }
    } catch (error) {
      console.error('Error fetching room files:', error);
    }
  };

  const fetchTasks = async (roomCode) => {
    try {
      const response = await fetch(`${API_URL}/api/tasks/room/${roomCode}`);
      if (response.ok) {
        const tasks = await response.json();
        setTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchMessages = async (roomCode) => {
    try {
      const response = await fetch(`${API_URL}/api/messages/room/${roomCode}`);
      if (response.ok) {
        const messages = await response.json();
        setMessages(messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const leaveRoom = async () => {
    if (!window.confirm("Are you sure you want to leave this room? All your data will be deleted.")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/rooms/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code.toUpperCase(),
          userId: user._id
        })
      });

      if (response.ok) {
        const data = await response.json();
        const saved = localStorage.getItem("collabUser");
        const userData = JSON.parse(saved);
        userData.rooms = data.rooms;
        localStorage.setItem("collabUser", JSON.stringify(userData));
        navigate("/");
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      alert("Error leaving room");
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("collabUser");
    if (!saved) {
      navigate("/");
      return;
    }

    const data = JSON.parse(saved);
    const currentUser = data.user;
    const savedRoom = data.room;

    // Validate room code
    if (savedRoom.code.toUpperCase() !== code.toUpperCase()) {
      navigate("/");
      return;
    }

    setUser(currentUser);
    setRoom(savedRoom);

    // Fetch initial data
    fetchTasks(code.toUpperCase());
    fetchMessages(code.toUpperCase());
    fetchRoomFiles(code.toUpperCase());

    const sock = connectSocket();
    if (!sock) {
      navigate("/");
      return;
    }

    // Join room if code changed
    if (prevCodeRef.current !== code.toUpperCase()) {
      sock.emit("join-room", { roomCode: code.toUpperCase() });
      prevCodeRef.current = code.toUpperCase();
    }

    // Listen for live updates
    const handleRoomUpdate = (updatedRoom) => {
      console.log("Live update:", updatedRoom.members.length + " members");
      setRoom(updatedRoom);
      setMembers(updatedRoom.members.map(m => m.user));
    };
    
    // Set initial members from saved room data
    if (savedRoom.members) {
      setMembers(savedRoom.members.map(m => m.user));
    }

    sock.on("room-update", handleRoomUpdate);

    return () => {
      sock.off("room-update", handleRoomUpdate);
    };
  }, [code]);

  if (!room || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-2xl text-gray-600">
        Loading room...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">{room.name}</h1>
            <p className="text-lg opacity-90 mt-1">
              Room Code: <span className="font-mono bg-white/20 px-4 py-1 rounded-lg">{room.code}</span>
            </p>
          </div>
          <div className="text-right flex items-center gap-4">
            <div>
              <p className="text-xl">Hello, <span className="font-bold">{user.name}</span></p>
            </div>
            <button
              onClick={leaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition font-semibold"
            >
              Leave Room
            </button>
            <MembersDropdown />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 p-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <MemberList />
          <RoomsList />
        </div>

        {/* Tasks & Chat */}
        <div className="lg:col-span-3 space-y-8">
          <TaskBoard />
          <Chat />
        </div>
      </div>
    </div>
  );
}
