// src/pages/AnalyticsPage.jsx
import { useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import html2pdf from "html2pdf.js";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { code } = useParams();
  const reportRef = useRef();
  const { tasks, members, room, user } = useRoom();

  // Calculate task distribution
  const distribution = {
    todo: tasks.filter(t => t.status === "todo").length,
    doing: tasks.filter(t => t.status === "doing").length,
    done: tasks.filter(t => t.status === "done").length
  };

  const totalTasks = distribution.todo + distribution.doing + distribution.done;
  const completionRate = totalTasks > 0 ? Math.round((distribution.done / totalTasks) * 100) : 0;

  // Calculate per-member stats
  const memberStats = members.map(member => {
    const memberTasks = tasks.filter(t => t.assignee?._id === member._id);
    const completed = memberTasks.filter(t => t.status === "done").length;
    const inProgress = memberTasks.filter(t => t.status === "doing").length;
    const pending = memberTasks.filter(t => t.status === "todo").length;
    
    return {
      ...member,
      total: memberTasks.length,
      completed,
      inProgress,
      pending
    };
  }).sort((a, b) => (b.completed + b.inProgress) - (a.completed + a.inProgress));

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-blue-500";
    if (percentage >= 25) return "bg-yellow-500";
    return "bg-red-500";
  };

  const downloadPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `${room?.name}-analytics-report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-lg opacity-90 mt-1">{room?.name}</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={downloadPDF}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2"
            >
              📥 Download PDF
            </button>
            <button
              onClick={() => navigate(`/room/${code}`)}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg transition font-semibold"
            >
              ← Back to Room
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        <div ref={reportRef} className="bg-white rounded-2xl shadow-lg p-8">
          {/* Report Title */}
          <div className="mb-8 pb-6 border-b-2 border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800">{room?.name} - Analytics Report</h2>
            <p className="text-gray-600 mt-2">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          {/* Overall Stats */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-lg">
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Total Tasks</p>
                <p className="text-5xl font-bold text-blue-600 mt-4">{totalTasks}</p>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 shadow-lg">
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">To Do</p>
                <p className="text-5xl font-bold text-yellow-600 mt-4">{distribution.todo}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-lg">
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">In Progress</p>
                <p className="text-5xl font-bold text-purple-600 mt-4">{distribution.doing}</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 shadow-lg">
                <p className="text-gray-600 text-sm font-semibold uppercase tracking-wide">Completed</p>
                <p className="text-5xl font-bold text-green-600 mt-4">{distribution.done}</p>
              </div>
            </div>
          </div>

          {/* Completion Progress */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Overall Progress</h3>
            <div className="flex justify-between items-center mb-4">
              <p className="text-lg font-semibold text-gray-700">Completion Rate</p>
              <p className="text-4xl font-bold text-gray-800">{completionRate}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all ${getProgressColor(completionRate)}`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* Team Performance */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Team Performance</h3>
            <div className="space-y-4">
              {memberStats.length > 0 ? (
                memberStats.map((member, idx) => (
                  <div key={member._id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-400 w-12 text-center">#{idx + 1}</div>
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-lg text-gray-800">{member.name}</p>
                          <p className="text-sm text-gray-600">{member.total} tasks assigned</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 text-center border-2 border-green-200">
                        <p className="text-3xl font-bold text-green-600">{member.completed}</p>
                        <p className="text-sm text-gray-600 mt-1">Done</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center border-2 border-purple-200">
                        <p className="text-3xl font-bold text-purple-600">{member.inProgress}</p>
                        <p className="text-sm text-gray-600 mt-1">Doing</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center border-2 border-yellow-200">
                        <p className="text-3xl font-bold text-yellow-600">{member.pending}</p>
                        <p className="text-sm text-gray-600 mt-1">To Do</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-12 text-lg">No members assigned to tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
