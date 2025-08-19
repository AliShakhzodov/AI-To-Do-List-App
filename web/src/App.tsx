import { useEffect, useState } from "react";
import { db, auth } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import AuthPage from "./AuthPage";
import { createTaskFromNL } from "./lib/api";
import { Bot, Plus, Calendar, Users, Sparkles, Clock } from 'lucide-react';

type Task = {
  Task_Title: string;
  Participants: string[];
  Task_Due_Date: Timestamp | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  source?: "ai" | "manual";
  family?: string | null;
};

export function App() {
  const [text, setText] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<string | null>(null);
  const [manual, setManual] = useState({ title: "", participants: "", due: "" });
  const [tasks, setTasks] = useState<{ id: string; data: Task }[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state

  // Auth state persistence - this will automatically sign in users
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch user's family when they're signed in
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          setFamily(userDoc.data()?.family || null);
        } catch (error) {
          console.error("Error fetching user family:", error);
        }
      } else {
        setUser(null);
        setFamily(null);
      }
      setLoading(false); // Auth state determined
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  useEffect(() => {
    if (!family || typeof family !== "string") return;

    const q = query(
      collection(db, "tasks"),
      where("family", "==", family)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setTasks(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as Task,
        }))
      );
    });

    return () => unsubscribe();
  }, [family]);

  // Now do conditional rendering AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="text-slate-600 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  async function submitNL() {
    if (!text.trim()) return;
    await createTaskFromNL(text, user!.uid, family!);
    setText(""); // Clear the input after creating the task
  }

  async function handleDeleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
  }

  async function handleCompleteTask(id: string) {
    await deleteDoc(doc(db, "tasks", id));
  }

  async function submitManual(userFamily: string) {
    if (!manual.title.trim()) return;

    const col = collection(db, "tasks");
    await addDoc(col, {
      Task_Title: manual.title.trim(),
      Participants: manual.participants
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      Task_Due_Date: manual.due ? Timestamp.fromDate(new Date(manual.due)) : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      source: "manual",
      family: userFamily, // <-- associate task with the user's family
    } as Task);

    setManual({ title: "", participants: "", due: "" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI To-Do
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                {user.email} • {family || 'No Family'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Tasks Display */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Your Tasks</h2>
            <div className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
              {tasks.length} tasks
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {tasks.map(({ id, data }) => (
              <article
                key={id}
                className="relative group bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl border border-white/50 p-6 transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 text-lg leading-tight flex-1 pr-3">
                    {data.Task_Title}
                  </h3>
                  <div className="flex-shrink-0">
                    {data.source === "ai" ? (
                      <div className="px-3 py-1 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 text-xs font-medium rounded-full flex items-center space-x-1">
                        <Bot className="w-3 h-3" />
                        <span>AI</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 text-xs font-medium rounded-full flex items-center space-x-1">
                        <Plus className="w-3 h-3" />
                        <span>MANUAL</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>
                      {data.Participants?.length ? (
                        <span className="flex flex-wrap gap-1">
                          {data.Participants.map((participant, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium"
                            >
                              {participant}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No participants</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {data.Task_Due_Date?.toDate ? (
                        <span className="text-slate-700 font-medium">
                          {data.Task_Due_Date.toDate().toLocaleDateString("en-US", {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No deadline</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleCompleteTask(id)}
                    className="px-3 py-1 border-2 border-gray-300 bg-green-200 hover:bg-green-400 hover:underline text-green-700 text-xs font-medium rounded-lg transition"
                  >
                    Task Completed
                  </button>
                  <button
                    onClick={() => handleDeleteTask(id)}
                    className="px-3 py-1 border-2 border-gray-300 bg-red-200 hover:bg-red-400 hover:line-through text-red-700 text-xs font-medium rounded-lg transition"
                  >
                    Delete Task
                  </button>
                </div>

                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
              </article>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-600 mb-2">No tasks yet</h3>
              <p className="text-slate-400">Create your first task using AI or manual entry above.</p>
            </div>
          )}
        </section>
        {/* AI Input Section */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Create with AI</h2>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Describe your task in natural language
            </label>
            <div className="relative">
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-4 text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none shadow-sm"
                rows={4}
                placeholder='Try: "Schedule team meeting with Alex and Sarah for next Friday at 3 PM to discuss the new project roadmap"'
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="absolute bottom-4 right-4 text-xs text-slate-400">
                {text.length}/500
              </div>
            </div>
            <button
              onClick={submitNL}
              className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              disabled={!text.trim()}
            >
              <Bot className="w-4 h-4" />
              <span>Generate with AI</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
            </button>
          </div>
        </section>

        {/* Manual Entry Section */}
        <section className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg shadow-md">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Manual Entry</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-600 mb-2">Task Title</label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-3 text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 shadow-sm"
                placeholder="Enter your task title..."
                value={manual.title}
                onChange={(e) => setManual({ ...manual, title: e.target.value })}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Participants</span>
              </label>
              <input
                className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-3 text-slate-800 placeholder-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 shadow-sm"
                placeholder="Add participants (comma separated)"
                value={manual.participants}
                onChange={(e) => setManual({ ...manual, participants: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-3 text-slate-800 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 transition-all duration-200 shadow-sm"
                value={manual.due}
                onChange={(e) => setManual({ ...manual, due: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={() => family && submitManual(family)}
            className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-600 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            disabled={!manual.title.trim() || !family}
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
          </button>
        </section>
      </div>
    </div>
  );
}