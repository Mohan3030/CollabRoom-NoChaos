// src/components/RoomsList.jsx
import { useNavigate, useParams } from "react-router-dom";

export default function RoomsList() {
  const navigate = useNavigate();
  const { code } = useParams();
  const saved = localStorage.getItem("collabUser");
  const userData = saved ? JSON.parse(saved) : {};
  const userRooms = userData.rooms || [];

  const handleRoomClick = async (roomCode) => {
    try {
      const response = await fetch(`http://localhost:3000/api/tasks/room/${roomCode}`);
      if (response.ok) {
        // Update localStorage with new room
        const updatedData = {
          ...userData,
          room: userRooms.find(r => r.code === roomCode)
        };
        localStorage.setItem("collabUser", JSON.stringify(updatedData));
        navigate(`/room/${roomCode}`);
      }
    } catch (error) {
      console.error('Error switching room:', error);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Rooms</h2>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {userRooms.length > 0 ? (
          userRooms.map(room => (
            <button
              key={room.code}
              onClick={() => handleRoomClick(room.code)}
              className={`w-full text-left p-4 rounded-lg transition ${
                room.code === code
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
            >
              <p className="font-semibold">{room.name}</p>
              <p className="text-xs opacity-75">{room.code}</p>
            </button>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">No rooms yet</p>
        )}
      </div>
    </div>
  );
}
