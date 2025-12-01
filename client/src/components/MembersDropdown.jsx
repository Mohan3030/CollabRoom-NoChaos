// src/components/MembersDropdown.jsx
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoom } from "../context/RoomContext";

export default function MembersDropdown() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { members, tasks } = useRoom();
  const [isOpen, setIsOpen] = useState(false);

  const memberStats = members.map(member => {
    const memberTasks = tasks.filter(t => t.assignee?._id === member._id);
    const done = memberTasks.filter(t => t.status === "done").length;
    const doing = memberTasks.filter(t => t.status === "doing").length;
    const total = memberTasks.length;
    
    return {
      ...member,
      done,
      doing,
      total
    };
  }).sort((a, b) => (b.done + b.doing) - (a.done + a.doing));

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <span>👥 Members</span>
        <span className="text-sm">{members.length}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
            <h3 className="font-bold text-lg">Team Members</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {memberStats.length > 0 ? (
              memberStats.map((member, idx) => (
                <div key={member._id} className="border-b last:border-b-0 p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.total} tasks assigned</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{member.done + member.doing}</p>
                      <p className="text-xs text-gray-500">active</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 mt-3">
                    <div className="flex-1 bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-2xl font-bold text-green-600">{member.done}</p>
                      <p className="text-xs text-gray-600">Done</p>
                    </div>
                    <div className="flex-1 bg-purple-50 rounded-lg p-2 text-center">
                      <p className="text-2xl font-bold text-purple-600">{member.doing}</p>
                      <p className="text-xs text-gray-600">Doing</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No members yet
              </div>
            )}
          </div>

          <div className="border-t p-4 bg-gray-50">
            <button
              onClick={() => {
                navigate(`/room/${code}/analytics`);
                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition"
            >
              📊 View Full Analytics
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
