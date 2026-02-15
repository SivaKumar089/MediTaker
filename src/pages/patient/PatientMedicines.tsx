import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaPills, FaClock, FaPrescriptionBottleAlt, FaInfoCircle, FaCalendarCheck, FaEdit, FaSave, FaTimes } from "react-icons/fa";

export default function PatientMedicines() {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ dosage: "", instructions: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) fetchMyMeds();
    }, [user]);

    const fetchMyMeds = async () => {
        try {
            const { data, error } = await supabase
                .from('assigned_medicines')
                .select(`
                    id,
                    dosage,
                    frequency,
                    instructions,
                    time_schedule,
                    start_date,
                    end_date,
                    medicines (
                        name,
                        category,
                        description
                    )
                `)
                .eq('patient_id', user!.id)
                .eq('status', 'active');

            if (error) throw error;
            setMedicines(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setEditForm({
            dosage: item.dosage,
            instructions: item.instructions || ""
        });
    };

    const handleUpdate = async (id: string) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('assigned_medicines')
                .update({
                    dosage: editForm.dosage,
                    instructions: editForm.instructions
                })
                .eq('id', id);

            if (error) throw error;

            toast.success("Medication details updated!");
            setEditingId(null);
            fetchMyMeds();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-12">
            <ToastContainer />
            <header>
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Prescription Management</h1>
                <p className="text-gray-500 font-medium">View and manage your active medication schedule and dosages.</p>
            </header>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                </div>
            ) : medicines.length === 0 ? (
                <div className="bg-white p-20 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <FaPrescriptionBottleAlt className="mx-auto text-6xl text-gray-200 mb-6" />
                    <h2 className="text-xl font-bold text-gray-800">No Active Medications</h2>
                    <p className="text-gray-500 mt-2 font-medium">When your caretaker assigns medicines, they will appear here.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {medicines.map((item) => (
                        <div key={item.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                                            <FaPills />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-black text-gray-800 text-lg truncate">{item.medicines?.name}</h3>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">
                                                {item.medicines?.category || 'Tablet'}
                                            </span>
                                        </div>
                                    </div>
                                    {editingId !== item.id && (
                                        <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition">
                                            <FaEdit />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center text-sm font-black text-gray-700">
                                        <FaClock className="mr-3 text-emerald-500 text-lg" />
                                        <span>{item.frequency} Times Daily</span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                                            <FaCalendarCheck className="mr-1 text-emerald-600" /> Daily Schedule
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {['morning', 'afternoon', 'evening', 'night'].map(slot => (
                                                <span key={slot} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${item.time_schedule?.[slot] ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-gray-300 border border-gray-100'}`}>
                                                    {slot}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {editingId === item.id ? (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                            <div>
                                                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Dosage</label>
                                                <input
                                                    type="text"
                                                    value={editForm.dosage}
                                                    onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                                                    className="w-full p-3 bg-white border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">Special Instructions</label>
                                                <textarea
                                                    value={editForm.instructions}
                                                    onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                                                    className="w-full p-3 bg-white border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 font-medium text-xs resize-none"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleUpdate(item.id)}
                                                    disabled={saving}
                                                    className="flex-1 bg-emerald-600 text-white p-3 rounded-xl font-black text-xs hover:bg-emerald-700 transition flex items-center justify-center"
                                                >
                                                    <FaSave className="mr-2" /> {saving ? 'Saving...' : 'Save Updates'}
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Dosage & Guidance</p>
                                            <p className="text-sm font-bold text-gray-700 leading-tight">
                                                {item.dosage} • {item.instructions || 'Follow standard precautions'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase">Ends {item.end_date}</span>
                                <FaInfoCircle className="text-gray-300 cursor-help hover:text-emerald-500 transition" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
