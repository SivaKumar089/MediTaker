import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaHeartbeat, FaNotesMedical, FaCheckCircle, FaHistory, FaPlus, FaArrowRight, FaChartLine } from "react-icons/fa";

export default function HealthRecords() {
    const { user } = useAuth();
    const [heartRate, setHeartRate] = useState("");
    const [bp, setBp] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        if (user) fetchRecords();
    }, [user]);

    const fetchRecords = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('health_records')
            .select('*')
            .eq('patient_id', user!.id)
            .order('recorded_at', { ascending: false });

        if (!error) setRecords(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!heartRate && !bp) return toast.error("Please enter heart rate or blood pressure");

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('health_records')
                .insert([{
                    patient_id: user!.id,
                    heart_rate: heartRate ? parseInt(heartRate) : null,
                    blood_pressure: bp || null,
                    notes: notes || null
                }]);

            if (error) throw error;

            toast.success("Health record saved successfully!");
            setHeartRate("");
            setBp("");
            setNotes("");
            setShowForm(false);
            fetchRecords();
        } catch (error: any) {
            toast.error(error.message || "Failed to save record");
        } finally {
            setSubmitting(false);
        }
    };

    const latest = records[0];

    return (
        <div className="max-w-[1200px] mx-auto space-y-10 pb-20 px-4">
            <ToastContainer />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl font-[900] text-gray-900 tracking-tight leading-none mb-3">Vitals Monitoring</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        Real-time Health Analytics
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`px-8 py-4 rounded-2xl font-black transition-all flex items-center shadow-xl ${showForm ? 'bg-gray-100 text-gray-600' : 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700'}`}
                >
                    {showForm ? 'Cancel Entry' : <><FaPlus className="mr-2" /> Log New Vitals</>}
                </button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <FaHeartbeat className="text-8xl text-rose-500" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Latest Heart Rate</p>
                    <div className="flex items-baseline">
                        <span className="text-5xl font-black text-gray-800">{latest?.heart_rate || '--'}</span>
                        <span className="ml-2 text-xs font-black text-rose-500 uppercase">BPM</span>
                    </div>
                    <div className="mt-6 flex items-center text-xs font-bold text-gray-400">
                        {latest?.recorded_at ? new Date(latest.recorded_at).toLocaleDateString() : 'No data yet'}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <FaNotesMedical className="text-8xl text-blue-500" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Latest BP</p>
                    <div className="flex items-baseline">
                        <span className="text-5xl font-black text-gray-800">{latest?.blood_pressure || '--'}</span>
                        <span className="ml-2 text-xs font-black text-blue-500 uppercase">mmHg</span>
                    </div>
                    <div className="mt-6 flex items-center text-xs font-bold text-gray-400">
                        Stable Monitoring
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] shadow-2xl text-white relative flex flex-col justify-between">
                    <div className="opacity-20 text-6xl mb-4"><FaChartLine /></div>
                    <div>
                        <h4 className="text-xl font-black mb-2">Health Insight</h4>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed">
                            Consistent tracking helps your caretaker identify patterns and provide better care.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Form or Chart */}
                <div className="lg:col-span-3 space-y-6">
                    {showForm ? (
                        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-10 animate-in slide-in-from-left duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Heart Rate</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            placeholder="72"
                                            value={heartRate}
                                            onChange={(e) => setHeartRate(e.target.value)}
                                            className="w-full p-6 bg-gray-50 border-4 border-transparent rounded-[2rem] outline-none focus:border-rose-500 focus:bg-white transition-all font-black text-2xl"
                                        />
                                        <FaHeartbeat className="absolute right-6 top-1/2 -translate-y-1/2 text-rose-200 text-2xl" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Blood Pressure</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="120/80"
                                            value={bp}
                                            onChange={(e) => setBp(e.target.value)}
                                            className="w-full p-6 bg-gray-50 border-4 border-transparent rounded-[2rem] outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-2xl"
                                        />
                                        <FaNotesMedical className="absolute right-6 top-1/2 -translate-y-1/2 text-blue-200 text-2xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Note (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-6 bg-gray-50 border-4 border-transparent rounded-[2rem] outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none font-bold"
                                    placeholder="How are you feeling?"
                                ></textarea>
                            </div>

                            <button
                                disabled={submitting}
                                className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-2xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center group"
                            >
                                <FaCheckCircle className="mr-3 text-2xl group-hover:scale-125 transition" />
                                {submitting ? "Logging..." : "Confirm Entry"}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
                            <div className="h-24 w-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 text-4xl">
                                <FaChartLine />
                            </div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight mb-2">Health Trends Dashboard</h3>
                            <p className="text-gray-400 font-bold max-w-sm mb-8">View your vitals progression over time with detailed logs.</p>
                            <button onClick={fetchRecords} className="text-emerald-600 font-black uppercase text-xs tracking-widest flex items-center hover:translate-x-1 transition">
                                Refresh Data <FaArrowRight className="ml-2" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Detailed Logs List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-gray-800 flex items-center tracking-tight">
                            <FaHistory className="mr-3 text-gray-400" /> Journal
                        </h2>
                    </div>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div></div>
                        ) : records.length === 0 ? (
                            <div className="p-12 text-center bg-gray-50 rounded-[2.5rem] border-4 border-dashed border-gray-100">
                                <p className="text-gray-400 font-bold italic">No records found yet.</p>
                            </div>
                        ) : (
                            records.map((record) => (
                                <div key={record.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-3">
                                            <div className="flex space-x-6">
                                                {record.heart_rate && (
                                                    <div className="flex items-center">
                                                        <div className="h-2 w-2 bg-rose-500 rounded-full mr-2"></div>
                                                        <span className="font-black text-xl text-gray-800">{record.heart_rate}</span>
                                                        <span className="text-[10px] font-black text-gray-400 ml-1 uppercase">bpm</span>
                                                    </div>
                                                )}
                                                {record.blood_pressure && (
                                                    <div className="flex items-center">
                                                        <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                                                        <span className="font-black text-xl text-gray-800">{record.blood_pressure}</span>
                                                        <span className="text-[10px] font-black text-gray-400 ml-1 uppercase">mmHg</span>
                                                    </div>
                                                )}
                                            </div>
                                            {record.notes && (
                                                <p className="text-sm text-gray-500 font-bold bg-gray-50 p-4 rounded-2xl italic border-l-4 border-emerald-500">
                                                    "{record.notes}"
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 underline decoration-emerald-200">
                                                {new Date(record.recorded_at).toLocaleDateString()}
                                            </p>
                                            <p className="text-[10px] font-black text-gray-300 mt-1 uppercase">
                                                {new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
