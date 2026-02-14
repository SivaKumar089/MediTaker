import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaStethoscope, FaHeart, FaEye, FaEyeSlash } from "react-icons/fa";

interface LoginProps {
    role: "caretaker" | "patient";
}

export default function Login({ role }: LoginProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const isCaretaker = role === "caretaker";

    // Theme Configuration
    const theme = {
        primary: isCaretaker ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-500 hover:bg-emerald-600",
        text: isCaretaker ? "text-blue-600" : "text-emerald-500",
        border: isCaretaker ? "border-blue-300" : "border-emerald-300",
        bg: isCaretaker ? "bg-blue-50" : "bg-emerald-50",
        link: isCaretaker ? "/caretaker" : "/patient",
        gradient: isCaretaker
            ? "from-blue-500 to-cyan-500"
            : "from-emerald-400 to-teal-500",
        icon: isCaretaker ? <FaStethoscope className="text-4xl text-white" /> : <FaHeart className="text-4xl text-white" />,
        heading: isCaretaker ? "Caretaker Login" : "Patient Login",
        subheading: isCaretaker ? "Monitor and manage your patients' health" : "Track your medications and stay healthy",
        image: isCaretaker
            ? "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" // Doctor/Medical
            : "https://images.unsplash.com/photo-1544367563-12123d8965cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80" // Wellness/Yoga
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Verify role matches (optional but good security)
            // For now, we trust the profile query in AuthContext or just redirect
            // Ideally we check if the user actually has the 'role' in their profile

            const { data: profile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (profile && profile.role !== role) {
                await supabase.auth.signOut();
                toast.error(`Invalid role. Please login as a ${profile.role}.`);
                return;
            }

            toast.success("Login successful!");
            navigate(theme.link + "/dashboard");
        } catch (error: any) {
            if (error.message.includes("Email not confirmed") || error.code === "email_not_confirmed") {
                toast.error("Please confirm your email address or disabled 'Confirm email' in Supabase settings.");
            } else {
                toast.error(error.message || "Failed to login");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-sans">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Left Side (Caretaker) or Right Side (Patient) - Image Section */}
            <div className={`hidden lg:flex w-[60%] bg-cover bg-center items-center justify-center relative ${!isCaretaker ? "order-1" : "order-2"}`}
                style={{ backgroundImage: `url(${theme.image})` }}>
                <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-80`}></div>
                <div className="relative z-10 text-center text-white p-12">
                    <div className="mb-6 flex justify-center">{theme.icon}</div>
                    <h2 className="text-4xl font-bold mb-4">Welcome to MediCare Tracker</h2>
                    <p className="text-xl max-w-lg mx-auto">{theme.subheading}</p>
                </div>
            </div>

            {/* Right Side (Caretaker) or Left Side (Patient) - Form Section */}
            <div className={`w-full lg:w-[40%] flex items-center justify-center p-8 bg-white ${!isCaretaker ? "order-2" : "order-1"}`}>
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center">
                        <h1 className={`text-3xl font-bold ${isCaretaker ? 'text-gray-900' : 'text-gray-900'}`}>{theme.heading}</h1>
                        <p className="mt-2 text-gray-600">Please sign in to continue</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors duration-200"
                                    style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties}
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="relative mt-1">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors duration-200"
                                        style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties}
                                        placeholder="Enter your password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className={`h-4 w-4 text-white border-gray-300 rounded focus:ring-2`}
                                    style={{ accentColor: isCaretaker ? '#2563eb' : '#059669' }}
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link to={`${theme.link}/forgot-password`} className={`font-medium hover:underline ${theme.text}`}>
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${theme.primary} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>

                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600">
                                New {isCaretaker ? 'Caretaker' : 'Patient'}?{' '}
                                <Link to={`${theme.link}/signup`} className={`font-medium hover:underline ${theme.text}`}>
                                    Sign up here
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
