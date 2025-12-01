// src/App.jsx
import { useState } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Room from "./pages/Room";
import AnalyticsPage from "./pages/AnalyticsPage";

function Home() {
  const [mode, setMode] = useState("home"); // home | create | join
  const [roomName, setRoomName] = useState("");
  const [userName, setUserName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:3000/api/rooms";

  const createRoom = async () => {
    if (!roomName.trim() || !userName.trim()) return alert("Fill both fields");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/create`, { roomName, userName });
      const userData = {
        user: res.data.user,
        room: res.data.room,
        rooms: res.data.rooms || [],
        token: res.data.token
      };
      localStorage.setItem("collabUser", JSON.stringify(userData));
      window.location.href = `/room/${res.data.room.code}`;
    } catch (err) {
      alert(err.response?.data?.message || "Error creating room");
    }
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!roomCode.trim() || !userName.trim()) return alert("Fill both fields");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/join`, {
        roomCode: roomCode.toUpperCase(),
        userName,
      });
      const userData = {
        user: res.data.user,
        room: res.data.room,
        rooms: res.data.rooms || [],
        token: res.data.token
      };
      localStorage.setItem("collabUser", JSON.stringify(userData));
      window.location.href = `/room/${roomCode.toUpperCase()}`;
    } catch (err) {
      alert(err.response?.data?.message || "Room not found");
    }
    setLoading(false);
  };

  if (mode === "create") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-purple-700">
            Create New Project Room
          </h1>
          <input type="text" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)}
            className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <input type="text" placeholder="Project Name" value={roomName} onChange={(e) => setRoomName(e.target.value)}
            className="w-full p-4 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
          <button onClick={createRoom} disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition">
            {loading ? "Creating..." : "Create Room"}
          </button>
          <button onClick={() => setMode("home")} className="w-full mt-4 text-gray-600 hover:text-gray-800">← Back</button>
        </div>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 to-blue-600">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-8 text-indigo-700">Join Project Room</h1>
          <input type="text" placeholder="Your Name" value={userName} onChange={(e) => setUserName(e.target.value)}
            className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <input type="text" placeholder="Room Code" value={roomCode} onChange={(e) => setRoomCode(e.target.value)}
            className="w-full p-4 mb-6 border rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={joinRoom} disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-blue-700 transition">
            {loading ? "Joining..." : "Join Room"}
          </button>
          <button onClick={() => setMode("home")} className="w-full mt-4 text-gray-600 hover:text-gray-800">← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-600 to-indigo-600">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">CollabRoom</h1>
        <p className="text-xl text-white mb-12 opacity-90">Group projects without the chaos</p>
        <div className="space-x-8">
          <button onClick={() => setMode("create")}
            className="bg-white text-purple-600 px-10 py-5 rounded-2xl text-2xl font-bold shadow-2xl hover:scale-105 transition transform">
            Create Room
          </button>
          <button onClick={() => setMode("join")}
            className="bg-white text-indigo-600 px-10 py-5 rounded-2xl text-2xl font-bold shadow-2xl hover:scale-105 transition transform">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App with Router
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:code" element={<Room />} />
        <Route path="/room/:code/analytics" element={<AnalyticsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
