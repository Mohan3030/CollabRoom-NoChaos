// src/components/Chat.jsx
import { useState, useRef } from "react";
import { useRoom } from "../context/RoomContext";

export default function Chat() {
  const { messages, roomFiles, user, room, socket } = useRoom();
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const send = async () => {
    if (!input.trim()) return;
    
    try {
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: room.code,
          userId: user._id,
          content: input,
        })
      });
      
      if (response.ok) {
        setInput("");
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomCode', room.code);
    formData.append('userName', user.name);

    try {
      const response = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        fileInputRef.current.value = '';
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const allItems = [
    ...messages.map(msg => ({ ...msg, type: 'message' })),
    ...roomFiles.map(file => ({ ...file, type: 'file', _id: file.public_id, user: { name: file.uploadedBy } }))
  ].sort((a, b) => new Date(a.createdAt || a.uploadedAt) - new Date(b.createdAt || b.uploadedAt));

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold mb-6">Live Chat</h2>
      <div className="h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
        {allItems.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Say hi!</p>
        ) : (
          allItems.map(item => (
            <div key={item._id} className={`mb-4 ${item.user?.name === user.name ? "text-right" : ""}`}>
              <div className={`inline-block max-w-xs ${item.user?.name === user.name ? "bg-purple-600 text-white" : "bg-gray-200"} rounded-2xl px-5 py-3`}>
                <p className="text-xs opacity-80 mb-1">{item.user.name}</p>
                {item.type === 'file' ? (
                  <div>
                    <p className="text-sm mb-2">📎 {item.fileName}</p>
                    {item.fileType?.startsWith('image/') ? (
                      <div>
                        <img src={item.url} alt={item.fileName} className="max-w-full h-auto rounded mb-2" />
                        <a href={item.url} download={item.fileName} className="text-xs underline">
                          Download
                        </a>
                      </div>
                    ) : item.fileType === 'application/pdf' ? (
                      <div className="flex gap-2">
                        <a href={item.url} download={item.fileName} className="text-blue-300 underline text-sm">
                          Download PDF
                        </a>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-green-300 underline text-sm">
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <a href={item.url} download={item.fileName} className="text-blue-300 underline">
                        Download {item.fileName}
                      </a>
                    )}
                  </div>
                ) : (
                  <p>{item.content}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === "Enter" && send()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
          title="Upload file"
        >
          {uploading ? "📤" : "📎"}
        </button>
        <button onClick={send} className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700">
          Send
        </button>
      </div>
    </div>
  );
}