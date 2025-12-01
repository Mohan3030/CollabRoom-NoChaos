// components/MemberList.jsx
import { useRoom } from "../context/RoomContext";

export default function MemberList() {
  const { members, user } = useRoom(); // ← comes from live socket now

  if (!members) return <div>Loading members...</div>;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Members ({members.length})</h2>
      {members.map(m => (
        <div key={m._id} className="flex items-center gap-3 mb-3">
          <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`} 
               alt="" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium">{m.name}</p>
            {m._id === user?._id && <span className="text-xs text-green-600">You</span>}
          </div>
        </div>
      ))}
    </div>
  );
}