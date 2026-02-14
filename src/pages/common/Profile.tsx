import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaUserCircle, FaEnvelope, FaNotesMedical, FaUserMd, FaPhone, FaCalendarAlt, FaAddressCard } from "react-icons/fa";

export default function Profile() {
    const { user, role } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        age: "",
        address: "",
        condition: "", // Patient only
        specialization: "", // Caretaker only
        experience: "" // Caretaker only
    });

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user!.id)
                .single();

            if (data) {
                setProfile(data);
                setFormData({
                    full_name: data.full_name || "",
                    phone: data.phone || "",
                    age: data.age || "",
                    address: data.address || "",
                    condition: data.condition || "",
                    specialization: data.specialization || "",
                    experience: data.experience || ""
                });
            }
        } catch (error) {
            console.error("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user!.id);

            if (error) throw error;

            toast.success("Profile updated!");
            setIsEditing(false);
            fetchProfile();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <ToastContainer />

            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Your Account</h1>
                <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`px-6 py-2 rounded-xl font-bold transition-all shadow-md ${isEditing ? 'bg-gray-100 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    {isEditing ? "Cancel" : "Edit Profile"}
                </button>
            </header>

            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className={`h-40 ${role === 'caretaker' ? 'bg-gradient-to-r from-blue-600 to-indigo-700' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}></div>

                <div className="px-8 pb-8">
                    <div className="relative flex items-end -mt-16 mb-8">
                        <div className="h-32 w-32 rounded-3xl border-8 border-white bg-gray-50 shadow-2xl flex items-center justify-center text-5xl text-gray-300 overflow-hidden">
                            {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <FaUserCircle />
                            )}
                        </div>
                        <div className="ml-6 mb-2">
                            <h2 className="text-3xl font-black text-gray-800">{profile?.full_name || "New User"}</h2>
                            <p className="text-gray-500 font-medium">{user?.email}</p>
                        </div>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Age</label>
                                        <input
                                            type="number"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">Address</label>
                                    <textarea
                                        rows={2}
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                {role === 'caretaker' ? (
                                    <>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Specialization</label>
                                            <input
                                                type="text"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Years of Experience</label>
                                            <input
                                                type="number"
                                                value={formData.experience}
                                                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                                className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">Medical Conditions</label>
                                        <textarea
                                            rows={5}
                                            value={formData.condition}
                                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            placeholder="List any chronic conditions or allergies..."
                                        />
                                    </div>
                                )}
                                <div className="pt-4">
                                    <button
                                        disabled={saving}
                                        className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-xl hover:bg-black transition active:scale-95 disabled:opacity-50"
                                    >
                                        {saving ? "Saving Changes..." : "Save Settings"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Basic Information</h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <FaPhone className="text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                                            <p className="text-sm font-semibold">{profile?.phone || '--'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-600">
                                        <FaCalendarAlt className="text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Age</p>
                                            <p className="text-sm font-semibold">{profile?.age ? `${profile.age} yrs` : '--'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-gray-600 col-span-2">
                                        <FaAddressCard className="text-blue-500" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Location</p>
                                            <p className="text-sm font-semibold">{profile?.address || 'City, Country'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
                                    {role === 'caretaker' ? 'Professional Portfolio' : 'Medical Record Summary'}
                                </h3>
                                {role === 'caretaker' ? (
                                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                                        <p className="text-xs font-bold text-blue-500 uppercase mb-2">Expertise</p>
                                        <p className="text-xl font-bold text-blue-900 mb-1">{profile?.specialization || 'Nurse Practitioner'}</p>
                                        <p className="text-sm text-blue-700">{profile?.experience ? `${profile.experience} years of clinical experience` : 'Experience details not listed'}</p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                                        <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Conditions & Health Notes</p>
                                        <p className="text-gray-700 font-medium leading-relaxed italic">
                                            "{profile?.condition || 'No chronic conditions listed in profile.'}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
