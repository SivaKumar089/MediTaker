import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaHeartbeat, FaNotesMedical, FaCheckCircle, FaHistory, FaPlus, FaChartLine, FaThermometerHalf, FaTint, FaTrash } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

export default function HealthRecords() {
    const { user } = useAuth();
    const [heartRate, setHeartRate] = useState("");
    const [bp, setBp] = useState("");
    const [sugar, setSugar] = useState("");
    const [temp, setTemp] = useState("");
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

        // Fix: Validation & Integer parsing
        if (!heartRate && !bp && !sugar && !temp)
            return toast.error("Please enter at least one health metric");

        const hrVal = heartRate.trim() === "" ? null : parseInt(heartRate);
        const sugarVal = sugar.trim() === "" ? null : parseInt(sugar);
        const tempVal = temp.trim() === "" ? null : parseFloat(temp);

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('health_records')
                .insert([{
                    patient_id: user!.id,
                    heart_rate: hrVal,
                    blood_pressure: bp.trim() || null,
                    sugar_level: sugarVal,
                    temperature: tempVal,
                    notes: notes.trim() || null
                }]);

            if (error) throw error;

            toast.success("Health record saved successfully!");
            setHeartRate("");
            setBp("");
            setSugar("");
            setTemp("");
            setNotes("");
            setShowForm(false);
            fetchRecords();
        } catch (error: any) {
            toast.error(error.message || "Failed to save record");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;
        try {
            const { error } = await supabase
                .from('health_records')
                .delete()
                .eq('id', id);
            if (error) throw error;
            toast.success("Record deleted");
            fetchRecords();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const chartData = [...records].reverse().map(r => ({
        name: format(new Date(r.recorded_at), 'MM/dd HH:mm'),
        hr: r.heart_rate,
        sugar: r.sugar_level,
        temp: r.temperature
    })).slice(-10); // Show last 10 records in chart

    const latest = records[0];

    return (
        <div className="max-w-[1200px] mx-auto space-y-10 pb-20 px-4 animate-in fade-in duration-700">
            <ToastContainer />

            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
                <div>
                    <h1 className="text-4xl font-[900] text-gray-900 tracking-tight leading-none mb-3">Vitals Journal</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em] flex items-center">
                        <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                        Historical Health Data
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><FaHeartbeat className="text-6xl text-rose-500" /></div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Heart Rate</p>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-black text-gray-800">{latest?.heart_rate || '--'}</span>
                        <span className="ml-1 text-[10px] font-black text-rose-500 uppercase">BPM</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><FaNotesMedical className="text-6xl text-blue-500" /></div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Blood Pressure</p>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-black text-gray-800">{latest?.blood_pressure || '--'}</span>
                        <span className="ml-1 text-[10px] font-black text-blue-500 uppercase">mmHg</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><FaTint className="text-6xl text-purple-500" /></div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Sugar Level</p>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-black text-gray-800">{latest?.sugar_level || '--'}</span>
                        <span className="ml-1 text-[10px] font-black text-purple-500 uppercase">mg/dL</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><FaThermometerHalf className="text-6xl text-amber-500" /></div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Temperature</p>
                    <div className="flex items-baseline">
                        <span className="text-3xl font-black text-gray-800">{latest?.temperature || '--'}</span>
                        <span className="ml-1 text-[10px] font-black text-amber-500 uppercase">°C</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 space-y-6">
                    {showForm ? (
                        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8 animate-in slide-in-from-left duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Heart Rate</label>
                                    <div className="relative">
                                        <input type="number" placeholder="72" value={heartRate} onChange={(e) => setHeartRate(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-4 border-transparent rounded-2xl outline-none focus:border-rose-500 focus:bg-white transition-all font-black text-xl" />
                                        <FaHeartbeat className="absolute right-5 top-1/2 -translate-y-1/2 text-rose-200 text-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Blood Pressure</label>
                                    <div className="relative">
                                        <input type="text" placeholder="120/80" value={bp} onChange={(e) => setBp(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-4 border-transparent rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all font-black text-xl" />
                                        <FaNotesMedical className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-200 text-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Sugar Level (mg/dL)</label>
                                    <div className="relative">
                                        <input type="number" placeholder="100" value={sugar} onChange={(e) => setSugar(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-4 border-transparent rounded-2xl outline-none focus:border-purple-500 focus:bg-white transition-all font-black text-xl" />
                                        <FaTint className="absolute right-5 top-1/2 -translate-y-1/2 text-purple-200 text-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Temperature (°C)</label>
                                    <div className="relative">
                                        <input type="number" step="0.1" placeholder="36.5" value={temp} onChange={(e) => setTemp(e.target.value)}
                                            className="w-full p-5 bg-gray-50 border-4 border-transparent rounded-2xl outline-none focus:border-amber-500 focus:bg-white transition-all font-black text-xl" />
                                        <FaThermometerHalf className="absolute right-5 top-1/2 -translate-y-1/2 text-amber-200 text-xl" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Notes</label>
                                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-5 bg-gray-50 border-4 border-transparent rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none font-bold text-sm"
                                    placeholder="How are you feeling?"></textarea>
                            </div>

                            <button disabled={submitting} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center group">
                                <FaCheckCircle className="mr-3 text-xl group-hover:scale-125 transition" />
                                {submitting ? "Logging..." : "Confirm Entry"}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 min-h-[400px] flex flex-col">
                            <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                                <FaChartLine className="mr-3 text-emerald-500" /> Recent Vitals Trends
                            </h3>
                            <div className="flex-1 min-h-[300px]">
                                {records.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis dataKey="name" fontSize={10} tick={{ fontWeight: 'bold' }} />
                                            <YAxis fontSize={10} tick={{ fontWeight: 'bold' }} />
                                            <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Legend />
                                            <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e' }} />
                                            <Line type="monotone" dataKey="sugar" name="Sugar" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7' }} />
                                            <Line type="monotone" dataKey="temp" name="Temp" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-300">
                                        <FaChartLine className="text-6xl mb-4 opacity-20" />
                                        <p className="font-bold">No trend data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-2xl font-black text-gray-800 flex items-center tracking-tight"><FaHistory className="mr-3 text-gray-400" /> Journal</h2>
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
                                        <div className="space-y-4 flex-1">
                                            <div className="flex flex-wrap gap-4">
                                                {record.heart_rate && <div className="flex items-center"><div className="h-2 w-2 bg-rose-500 rounded-full mr-2"></div><span className="font-black text-gray-800">{record.heart_rate}</span><span className="text-[10px] font-black text-gray-400 ml-1 uppercase">bpm</span></div>}
                                                {record.blood_pressure && <div className="flex items-center"><div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div><span className="font-black text-gray-800">{record.blood_pressure}</span><span className="text-[10px] font-black text-gray-400 ml-1 uppercase">mmHg</span></div>}
                                                {record.sugar_level && <div className="flex items-center"><div className="h-2 w-2 bg-purple-500 rounded-full mr-2"></div><span className="font-black text-gray-800">{record.sugar_level}</span><span className="text-[10px] font-black text-gray-400 ml-1 uppercase">mg/dL</span></div>}
                                                {record.temperature && <div className="flex items-center"><div className="h-2 w-2 bg-amber-500 rounded-full mr-2"></div><span className="font-black text-gray-800">{record.temperature}</span><span className="text-[10px] font-black text-gray-400 ml-1 uppercase">°C</span></div>}
                                            </div>
                                            {record.notes && <p className="text-xs text-gray-500 font-bold bg-gray-50 p-3 rounded-xl italic border-l-4 border-emerald-500">"{record.notes}"</p>}
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                                <p className="text-[10px] font-black text-gray-400">{new Date(record.recorded_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] font-black text-gray-300 uppercase">{new Date(record.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            className="ml-4 p-2 text-gray-300 hover:text-rose-500 transition-colors"
                                            title="Delete entry"
                                        >
                                            <FaTrash />
                                        </button>
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

