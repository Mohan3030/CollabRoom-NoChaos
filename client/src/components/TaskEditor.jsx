// src/components/TaskEditor.jsx
import { useState, useEffect, useRef } from "react";
import { useRoom } from "../context/RoomContext";

export default function TaskEditor({ isOpen, onClose, task }) {
  const { room, user, socket, taskMessages, setTaskMessages, taskFiles, setTaskFiles } = useRoom();
  const [content, setContent] = useState("");
  const [cursors, setCursors] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchTaskMessages = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/messages/task/${taskId}`);
      if (response.ok) {
        const messages = await response.json();
        setTaskMessages(prev => ({ ...prev, [taskId]: messages }));
      }
    } catch (error) {
      console.error('Error fetching task messages:', error);
    }
  };

  const fetchTaskFiles = async (taskId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/upload/task/${taskId}`);
      if (response.ok) {
        const files = await response.json();
        setTaskFiles(prev => ({ ...prev, [taskId]: files }));
      }
    } catch (error) {
      console.error('Error fetching task files:', error);
    }
  };

  useEffect(() => {
    if (task && isOpen) {
      setContent(task.description || "");
      fetchTaskMessages(task._id);
      fetchTaskFiles(task._id);
      socket?.emit("join-task", { taskId: task._id, user });
      
      socket?.on("task-content-change", ({ content: newContent, userId }) => {
        if (userId !== user._id) setContent(newContent);
      });
      
      socket?.on("cursor-position", ({ userId, position, userName }) => {
        setCursors(prev => ({ ...prev, [userId]: { position, userName, color: getUserColor(userId) } }));
      });
      
      socket?.on("user-left-task", ({ userId }) => {
        setCursors(prev => { const newCursors = { ...prev }; delete newCursors[userId]; return newCursors; });
      });
    }
    
    return () => {
      if (task) {
        socket?.emit("leave-task", { taskId: task._id, userId: user._id });
        socket?.off("task-content-change");
        socket?.off("cursor-position");
        socket?.off("user-left-task");
      }
    };
  }, [task, isOpen, socket, user]);

  const getUserColor = (userId) => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD"];
    return colors[userId.slice(-1).charCodeAt(0) % colors.length];
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    socket?.emit("task-content-change", { taskId: task._id, content: newContent, userId: user._id });
    const cursorPos = e.target.selectionStart;
    socket?.emit("cursor-position", { taskId: task._id, userId: user._id, userName: user.name, position: cursorPos });
  };

  const handleCursorMove = (e) => {
    const cursorPos = e.target.selectionStart;
    socket?.emit("cursor-position", { taskId: task._id, userId: user._id, userName: user.name, position: cursorPos });
  };

  const saveTask = async () => {
    try {
      await fetch(`http://localhost:3000/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: content })
      });
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const sendTaskMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: room.code, userId: user._id, content: chatInput, taskId: task._id })
      });
      setChatInput("");
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTaskFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomCode', room.code);
    formData.append('userName', user.name);
    formData.append('taskId', task._id);
    try {
      const response = await fetch('http://localhost:3000/api/upload', { method: 'POST', body: formData });
      if (response.ok) fileInputRef.current.value = '';
      else alert('Upload failed');
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !task) return null;

  const currentTaskMessages = taskMessages[task._id] || [];
  const currentTaskFiles = taskFiles[task._id] || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-5/6 flex">
        <div className="flex-1 p-6 border-r">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{task.title}</h2>
            <div className="flex gap-2">
              <button onClick={saveTask} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Save</button>
              <button onClick={onClose} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Close</button>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Editing:</span>
              {Object.entries(cursors).map(([userId, cursor]) => (
                <div key={userId} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: cursor.color + "20", color: cursor.color }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cursor.color }} />
                  {cursor.userName}
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <textarea ref={editorRef} value={content} onChange={handleContentChange} onSelect={handleCursorMove} onKeyUp={handleCursorMove} onClick={handleCursorMove} placeholder="Start writing your task details..." className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm leading-5" style={{ lineHeight: '20px', fontSize: '14px', fontFamily: 'Monaco, Consolas, "Courier New", monospace' }} />
            {Object.entries(cursors).map(([userId, cursor]) => {
              const textarea = editorRef.current;
              if (!textarea) return null;
              const textBeforeCursor = content.substring(0, cursor.position);
              const lines = textBeforeCursor.split('\n');
              const lineNumber = lines.length - 1;
              const columnNumber = lines[lines.length - 1].length;
              const style = window.getComputedStyle(textarea);
              const lineHeight = parseInt(style.lineHeight) || 20;
              const paddingTop = parseInt(style.paddingTop) || 16;
              const paddingLeft = parseInt(style.paddingLeft) || 16;
              const charWidth = 8.4;
              const top = paddingTop + (lineNumber * lineHeight);
              const left = paddingLeft + (columnNumber * charWidth);
              return (
                <div key={userId} className="absolute pointer-events-none z-10" style={{ top: `${Math.min(top, textarea.offsetHeight - 30)}px`, left: `${Math.min(left, textarea.offsetWidth - 100)}px` }}>
                  <div className="w-0.5 h-5 animate-pulse" style={{ backgroundColor: cursor.color }} />
                  <div className="text-xs px-1 rounded text-white whitespace-nowrap -mt-6" style={{ backgroundColor: cursor.color }}>{cursor.userName}</div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="w-72 p-3 flex flex-col overflow-hidden border-l">
          <h3 className="text-base font-bold mb-2">Discussion</h3>
          <div className="flex-1 overflow-y-auto border rounded p-2 mb-2 bg-gray-50 text-xs">
            {currentTaskMessages.length === 0 && currentTaskFiles.length === 0 ? (
              <p className="text-gray-500 text-center">No messages</p>
            ) : (
              [...currentTaskMessages.map(msg => ({ ...msg, type: 'message' })), ...currentTaskFiles.map(file => ({ ...file, type: 'file', _id: file.public_id, user: { name: file.uploadedBy, avatar: '' }, createdAt: file.uploadedAt }))]
                .sort((a, b) => new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt))
                .map(item => (
                  <div key={item._id} className="mb-2">
                    <div className="flex items-center gap-1 mb-1">
                      <img src={item.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name}`} alt="" className="w-4 h-4 rounded-full" />
                      <span className="font-medium">{item.user.name}</span>
                    </div>
                    {item.type === 'file' ? (
                      <div className="bg-white p-1 rounded border">
                        <p className="mb-1">📎 {item.fileName}</p>
                        {item.fileType?.startsWith('image/') ? (
                          <div><img src={item.url} alt={item.fileName} className="max-w-full h-auto rounded mb-1" /><a href={item.url} download={item.fileName} className="text-blue-600 underline">Download</a></div>
                        ) : item.fileType === 'application/pdf' ? (
                          <div className="flex gap-1"><a href={item.url} download={item.fileName} className="text-blue-600 underline">Download</a><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-green-600 underline">View</a></div>
                        ) : (
                          <a href={item.url} download={item.fileName} className="text-blue-600 underline">Download</a>
                        )}
                      </div>
                    ) : (
                      <p className="bg-white p-1 rounded">{item.content}</p>
                    )}
                  </div>
                ))
            )}
          </div>
          <div className="flex gap-1 items-center">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === "Enter" && sendTaskMessage()} placeholder="Message..." className="flex-1 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-purple-500" />
            <input ref={fileInputRef} type="file" onChange={handleTaskFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar" />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50 text-xs">{uploading ? "📤" : "📎"}</button>
            <button onClick={sendTaskMessage} className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs font-medium whitespace-nowrap">Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}