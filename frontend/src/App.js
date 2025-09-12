import Chat from "./Chat";

function App() {
  return (
    <div className="h-screen grid grid-cols-12">
      {/* Sidebar */}
      <aside className="col-span-3 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-6 text-blue-600 dark:text-blue-400">
          Chatbot
        </h2>

        <div className="flex-1 overflow-y-auto space-y-2">
          <button className="w-full text-left p-2 rounded-lg bg-white dark:bg-gray-700 shadow">
            Chat 1
          </button>
          <button className="w-full text-left p-2 rounded-lg bg-white dark:bg-gray-700 shadow">
            Chat 2
          </button>
        </div>

        <button className="mt-4 p-2 bg-blue-600 text-white rounded-lg">
          + New Chat
        </button>
      </aside>

      {/* Chat window */}
      <main className="col-span-9 flex flex-col bg-gray-50 dark:bg-gray-900">
        <Chat />
      </main>
    </div>
  );
}

export default App;
