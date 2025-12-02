// src/components/TaskBoard.jsx
import { useState } from "react";
import { useRoom } from "../context/RoomContext";
import API_URL from "../utils/api";
import TaskModal from "./TaskModal";
import TaskEditor from "./TaskEditor";

const columns = {
  todo: "To Do",
  doing: "Doing",
  done: "Done"
};

export default function TaskBoard() {
  const { tasks, socket, room, user } = useRoom();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  const createTask = async () => {
    if (!newTitle.trim()) return;
    try {
      const response = await fetch(`${API_URL}/api/tasks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: room.code,
          title: newTitle,
          description: ""
        })
      });
      if (response.ok) {
        setNewTitle("");
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const task = tasks.find(t => t._id === taskId);
      
      // Only assigned user can drag
      if (task.assignee && task.assignee._id !== user._id) {
        alert("Only the assigned user can move this task");
        return;
      }

      const updates = { status: newStatus };
      
      // Auto-assign to current user if unassigned
      if (!task.assignee) {
        updates.assignee = user._id;
      }
      
      // Unassign if moved to todo
      if (newStatus === "todo") {
        updates.assignee = null;
      }

      await fetch(`${API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const openTask = (task) => {
    setSelectedTask(task);
    setIsEditorOpen(true);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const deleteTask = (taskId, e) => {
    e.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      socket?.emit('task-delete', { taskId });
    }
  };

  const canDragTask = (task) => {
    return !task.assignee || task.assignee._id === user._id;
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Tasks</h2>
          <div className="flex gap-3">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyPress={e => e.key === "Enter" && createTask()}
              placeholder="New task..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button onClick={createTask} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
              Add
            </button>
            <button onClick={openCreateModal} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Create Detailed
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(columns).map(([key, title]) => (
            <div 
              key={key} 
              className="bg-gray-50 rounded-xl p-5"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("taskId");
                if (taskId) {
                  updateTaskStatus(taskId, key);
                }
              }}
            >
              <h3 className="font-bold text-lg mb-4 text-gray-700">{title} ({tasks.filter(t => t.status === key).length})</h3>
              <div className="space-y-3 min-h-[200px]">
                {tasks
                  .filter(task => task.status === key)
                  .map(task => (
                    <div
                      key={task._id}
                      onClick={() => openTask(task)}
                      className={`bg-white rounded-lg shadow hover:shadow-lg transition relative group overflow-hidden ${
                        canDragTask(task) ? "cursor-move" : "cursor-not-allowed opacity-60"
                      }`}
                      draggable={canDragTask(task)}
                      onDragStart={e => {
                        if (canDragTask(task)) {
                          e.dataTransfer.setData("taskId", task._id);
                          e.stopPropagation();
                        } else {
                          e.preventDefault();
                        }
                      }}
                    >
                      {task.assignee && (
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                            {task.assignee.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm">{task.assignee.name}</span>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <button
                          onClick={(e) => deleteTask(task._id, e)}
                          className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center text-sm font-bold"
                          title="Delete task"
                        >
                          ×
                        </button>
                        
                        <h4 className="font-semibold pr-8">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      
      <TaskEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        task={selectedTask}
      />
    </>
  );
}
