import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Mic, Send, Plus } from "lucide-react";

export default function Chat() {
  const [chats, setChats] = useState([{ id: 1, title: "New Chat", messages: [] }]);
  const [activeChat, setActiveChat] = useState(1);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, isTyping]);

  const addMessage = (text, sender) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  sender,
                  text,
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : c
      )
    );
  };

  const sendMessage = async (customInput) => {
    const message = customInput || input;
    if (!message.trim()) return;

    addMessage(message, "user");
    setInput("");
    setIsTyping(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", {
        question: message,
      });

      addMessage(res.data.reply || "⚠️ No answer found.", "bot");
    } catch (err) {
      console.error("Error:", err);
      addMessage("⚠️ Error connecting to backend.", "bot");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    const newId = chats.length + 1;
    setChats([...chats, { id: newId, title: "New Chat", messages: [] }]);
    setActiveChat(newId);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 font-bold text-lg flex items-center justify-between text-blue-400">
          <span>Medvarsity AI</span>
          <button
            onClick={newChat}
            className="bg-blue-600 hover:bg-blue-700 p-1 rounded-full"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-2">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${
                activeChat === chat.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {chat.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 p-4 flex justify-center bg-gray-850">
          <h1 className="text-xl font-semibold text-blue-400">
            Medvarsity Healthcare Assistant
          </h1>
        </div>

        {/* Chat Messages (scrollable only here) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {chats
            .find((c) => c.id === activeChat)
            ?.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl max-w-2xl ${
                    msg.sender === "user"
                      ? "bg-blue-500 text-white rounded-br-none"
                      : "bg-gray-700 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.sender === "bot" ? (
                    <div
                      className="prose prose-invert max-w-none prose-p:mb-3 prose-ul:list-disc prose-ul:pl-6 prose-li:mb-1 prose-strong:font-semibold prose-headings:mt-3 prose-headings:mb-2"
                      dangerouslySetInnerHTML={{ __html: msg.text }}
                    />
                  ) : (
                    msg.text
                  )}
                  <div className="text-xs opacity-60 mt-1">{msg.time}</div>
                </div>
              </div>
            ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-2xl flex space-x-2">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-150">●</span>
                <span className="animate-bounce delay-300">●</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 bg-gray-800 p-4 flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-700 rounded-full">
            <Mic size={20} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about courses, duration, or fees..."
            className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => sendMessage()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
