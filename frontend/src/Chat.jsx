import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", text: data.reply },
      ]);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-100 dark:bg-gray-900">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`p-3 max-w-md rounded-2xl shadow ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="p-3 bg-gray-300 dark:bg-gray-700 rounded-2xl rounded-bl-none shadow">
              Typing...
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-xl border dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={sendMessage}
          className="ml-3 px-5 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}

