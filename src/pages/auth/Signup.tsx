import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserMd, FaUser } from "react-icons/fa";

interface SignupProps {
    role: "caretaker" | "patient";
}

export default function Signup({ role }: SignupProps) {
    const navigate = useNavigate();
    const isCaretaker = role === "caretaker";
    const [loading, setLoading] = useState(false);

    // Common Fields
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
        phone: "",
        // Caretaker specific
        licenseNumber: "",
        specialization: "",
        experience: "",
        // Patient specific
        age: "",
        gender: "",
        medicalConditions: "",
        emergencyContactName: "",
        emergencyContactPhone: ""
    });

    // Theme Configuration
    const theme = {
        primary: isCaretaker ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-500 hover:bg-emerald-600",
        text: isCaretaker ? "text-blue-600" : "text-emerald-500",
        border: isCaretaker ? "border-blue-300" : "border-emerald-300",
        bg: isCaretaker ? "bg-blue-50" : "bg-emerald-50",
        link: isCaretaker ? "/caretaker" : "/patient",
        icon: isCaretaker ? <FaUserMd className="text-3xl text-blue-500" /> : <FaUser className="text-3xl text-emerald-500" />,
        heading: isCaretaker ? "Join as a Caretaker" : "Join as a Patient",
        subheading: isCaretaker ? "Help patients stay healthy" : "Never miss your medications",
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            // 1. Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        role: role,
                        phone: formData.phone,
                        // Add other metadata if needed by trigger or RLS
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                // The profile and user record insertion is now handled by the 
                // PostgreSQL trigger 'on_auth_user_created' we added to the schema.
                // This is more reliable than doing multiple frontend calls.

                toast.success("Account created successfully!");

                // Brief delay to allow trigger to complete
                setTimeout(() => {
                    navigate(theme.link + "/dashboard");
                }, 1500);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to sign up");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${theme.bg}`}>
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        {theme.icon}
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">{theme.heading}</h2>
                    <p className="mt-2 text-sm text-gray-600">{theme.subheading}</p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4">
                        {/* Common Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                <input name="fullName" required value={formData.fullName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                <input name="phone" required value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input name="email" type="email" required value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties} />
                            </div>
                            {/* Patient Age */}
                            {!isCaretaker && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Age</label>
                                    <input name="age" type="number" required min="13" value={formData.age} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#10b981' } as React.CSSProperties} />
                                </div>
                            )}
                            {/* Caretaker Experience */}
                            {isCaretaker && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                                    <input name="experience" type="number" value={formData.experience} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#3b82f6' } as React.CSSProperties} />
                                </div>
                            )}
                        </div>

                        {/* Caretaker Specific */}
                        {isCaretaker && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Medical License / ID</label>
                                    <input name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#3b82f6' } as React.CSSProperties} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Specialization</label>
                                    <select name="specialization" value={formData.specialization} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#3b82f6' } as React.CSSProperties}>
                                        <option value="">Select...</option>
                                        <option value="General">General</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Neurology">Neurology</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Geriatrics">Geriatrics</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Patient Specific */}
                        {!isCaretaker && (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gender</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#10b981' } as React.CSSProperties}>
                                            <option value="">Select...</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                                    <textarea name="medicalConditions" rows={2} value={formData.medicalConditions} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#10b981' } as React.CSSProperties} />
                                </div>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                                        <input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#10b981' } as React.CSSProperties} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                                        <input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': '#10b981' } as React.CSSProperties} />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <input name="password" type="password" required value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-offset-0 focus:outline-none transition-colors" style={{ '--tw-ring-color': isCaretaker ? '#3b82f6' : '#10b981' } as React.CSSProperties} />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input id="terms" name="terms" type="checkbox" required className="h-4 w-4 rounded border-gray-300" style={{ accentColor: isCaretaker ? '#2563eb' : '#059669' }} />
                            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                                I agree to the <a href="#" className={theme.text}>Terms</a> and <a href="#" className={theme.text}>Privacy Policy</a>
                            </label>
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${theme.primary} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to={`${theme.link}/login`} className={`font-medium hover:underline ${theme.text}`}>
                                Login here
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
