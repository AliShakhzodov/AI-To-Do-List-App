import { useState } from "react";
import { auth, db } from "./firebase";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const families = ["Maksudov", "Guest"];

// Remove the props since auth state is handled automatically
export default function AuthPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localFamily, setLocalFamily] = useState(families[0]);
    const [isRegistering, setIsRegistering] = useState(true);

    const handleAuth = async () => {
        try {
            if (isRegistering) {
                // Register new user
                const userCred = await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                await setDoc(doc(db, "users", userCred.user.uid), {
                    email,
                    family: localFamily,
                });

                // No need to manually set user/family - onAuthStateChanged will handle it
            } else {
                // Sign in existing user
                await signInWithEmailAndPassword(auth, email, password);
                // No need to manually set user/family - onAuthStateChanged will handle it
            }
        } catch (err: any) {
            alert(err.message || "Authentication error");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
                <div className="text-center mb-8">
                    <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg inline-block mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {isRegistering ? "Create Account" : "Welcome Back"}
                    </h1>
                    <p className="text-slate-600 mt-2">
                        {isRegistering ? "Join your family's task management" : "Sign in to manage your tasks"}
                    </p>
                </div>

                <div className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-4 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-4 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
                    />

                    {isRegistering && (
                        <select
                            value={localFamily}
                            onChange={(e) => setLocalFamily(e.target.value)}
                            className="w-full rounded-xl border-2 border-slate-200 bg-white/80 backdrop-blur-sm p-4 text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 shadow-sm"
                        >
                            {families.map((fam) => (
                                <option key={fam} value={fam}>
                                    {fam} Family
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={handleAuth}
                        className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        {isRegistering ? "Create Account" : "Sign In"}
                    </button>
                </div>

                <p
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-center text-indigo-600 hover:text-indigo-800 text-sm mt-6 cursor-pointer font-medium transition-colors"
                >
                    {isRegistering
                        ? "Already have an account? Sign In"
                        : "Need an account? Create Account"}
                </p>
            </div>
        </div>
    );
}