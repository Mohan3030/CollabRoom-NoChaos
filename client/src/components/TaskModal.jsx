// src/components/TaskModal.jsx
import { useState } from "react";
import { useRoom } from "../context/RoomContext";

export default function TaskModal({ isOpen, onClose }) {
  const { room, members } = useRoom();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeId, setAssigneeId] = useState("");

  const createTask = async () => {
    if (!title.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: room.code,
          title: title.trim(),
          description: description.trim(),
          assignee: assigneeId || null
        })
      });
      
      if (response.ok) {
        setTitle("");
        setDescription("");
        setAssigneeId("");
        onClose();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
        
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        
        <textarea
          placeholder="Task description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full p-4 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className="w-full p-4 mb-6 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Assign to (optional)</option>
          {members.map(member => (
            <option key={member._id} value={member._id}>
              {member.name}
            </option>
          ))}
        </select>
        
        <div className="flex gap-4">
          <button
            onClick={createTask}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700"
          >
            Create Task
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
