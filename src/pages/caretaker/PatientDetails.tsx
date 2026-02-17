import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { fetchPatientHealthRecords } from "../../services/statsService";
import { FaUserCircle, FaHistory, FaPills, FaArrowLeft, FaCheck, FaTimes, FaCamera, FaWeight, FaHeartbeat, FaPlus } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

type Tab = 'records' | 'meds';

export default function PatientDetails() {
    const { id } = useParams<{ id: string }>();
    const [patient, setPatient] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [assignedMeds, setAssignedMeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>('records');

    // Assignment Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [inventory, setInventory] = useState<any[]>([]);
    const [assignForm, setAssignForm] = useState({
        medicine_id: "",
        dosage: "",
        frequency: 1,
        duration_days: 7,
        instructions: ""
    });

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Fetch patient profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();
            setPatient(profile);

            // 2. Fetch health records (Requirements 2 & 10)
            const recs = await fetchPatientHealthRecords(id!);
            setRecords(recs || []);

            // 3. Fetch current assigned meds
            const { data: meds } = await supabase
                .from('assigned_medicines')
                .select('*, medicine:medicine_id(*)')
                .eq('patient_id', id)
                .eq('status', 'active');
            setAssignedMeds(meds || []);

            // 4. Fetch inventory for assignment
            const { data: inv } = await supabase
                .from('medicines')
                .select('*')
                .gt('current_stock', 0);
            setInventory(inv || []);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load patient data");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault();

        // Requirement 6: MAX 10 medicines validation
        if (assignedMeds.length >= 10) {
            toast.error("Patient 'My Store' limit reached (Max 10 active medicines)");
            return;
        }

        if (!assignForm.medicine_id) return toast.error("Select a medicine");

        const selectedMedicine = inventory.find(m => m.id === assignForm.medicine_id);
        if (!selectedMedicine) return toast.error("Medicine not found in inventory");

        const totalQuantityRequired = assignForm.frequency * assignForm.duration_days;

        if (selectedMedicine.current_stock < totalQuantityRequired) {
            toast.error(`Insufficient stock! You need ${totalQuantityRequired} units, but only ${selectedMedicine.current_stock} available.`);
            return;
        }

        try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + parseInt(assignForm.duration_days.toString()));

            // 1. Insert assignment
            const { error: assignError } = await supabase
                .from('assigned_medicines')
                .insert([{
                    ...assignForm,
                    patient_id: id,
                    caretaker_id: (await supabase.auth.getUser()).data.user?.id,
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                    time_schedule: { morning: true, afternoon: false, evening: true }, // Default
                    status: 'active'
                }]);

            if (assignError) throw assignError;

            // 2. Reduce stock from inventory
            const { error: stockError } = await supabase
                .from('medicines')
                .update({ current_stock: selectedMedicine.current_stock - totalQuantityRequired })
                .eq('id', assignForm.medicine_id);

            if (stockError) throw stockError;

            toast.success("Medicine assigned and stock updated successfully!");
            setShowAssignModal(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="p-20 text-center"><div className="animate-spin h-10 w-10 border-b-2 border-blue-600 mx-auto"></div></div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <ToastContainer />

            {/* Header */}
            <header className="flex items-center justify-between">
                <Link to="/caretaker/patients" className="flex items-center text-gray-400 hover:text-blue-600 font-bold transition">
                    <FaArrowLeft className="mr-2" /> Back to List
                </Link>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100 flex items-center"
                    >
                        <FaPlus className="mr-2" /> Assign Medicine
                    </button>
                </div>
            </header>

            {/* Profile Overview Card */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="h-32 w-32 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center text-5xl font-black shadow-inner border-4 border-white">
                    {patient?.full_name?.[0] || <FaUserCircle />}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-gray-800">{patient?.full_name}</h1>
                    <p className="text-gray-400 font-bold mt-1 uppercase tracking-widest text-xs">
                        {patient?.age ? `${patient.age} Years Old` : 'Age Not Provided'} • Patient Profile
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6 justify-center md:justify-start">
                        <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 italic">
                            {patient?.condition || 'No specific condition listed'}
                        </span>
                        <span className="bg-gray-50 text-gray-500 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-gray-100">
                            {patient?.address || 'Location Unknown'}
                        </span>
                    </div>
                </div>
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-6">
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Avg. Heart Rate</p>
                        <p className="text-2xl font-black text-rose-500">78 <span className="text-xs">BPM</span></p>
                    </div>
                    <div className="w-[1px] h-10 bg-gray-200"></div>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase">Compliance</p>
                        <p className="text-2xl font-black text-emerald-500">92%</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 bg-gray-100 p-2 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('records')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center ${activeTab === 'records' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaHistory className="mr-2" /> Health Records
                </button>
                <button
                    onClick={() => setActiveTab('meds')}
                    className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center ${activeTab === 'meds' ? 'bg-white text-emerald-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <FaPills className="mr-2" /> My Store ({assignedMeds.length}/10)
                </button>
            </div>

            {/* Tab Content: Health Records (Requirement 2) */}
            {activeTab === 'records' && (
                <div className="space-y-4">
                    {records.length === 0 ? (
                        <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed text-gray-300 font-bold text-center">
                            No health check-ins logged yet.
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {records.map((log) => (
                                <div key={log.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 group hover:shadow-xl transition-all">
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-black text-gray-800 text-lg flex items-center">
                                                    <span className="h-3 w-3 bg-emerald-500 rounded-full mr-3 animate-pulse"></span>
                                                    {log.assigned_medicine?.medicine?.name}
                                                </h4>
                                                <p className="text-xs text-gray-400 font-black tracking-widest uppercase mt-1">
                                                    Taken at {new Date(log.taken_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {log.heart_rate && (
                                                    <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-xs font-black flex items-center">
                                                        <FaHeartbeat className="mr-1" /> {log.heart_rate} BPM
                                                    </div>
                                                )}
                                                {log.blood_pressure && (
                                                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black flex items-center">
                                                        <FaWeight className="mr-1" /> {log.blood_pressure}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl italic text-gray-600 text-sm border-l-4 border-blue-200">
                                            "{log.notes || 'No notes added for this check-in'}"
                                        </div>
                                    </div>

                                    {/* Proof Photo Display (Requirement 4) */}
                                    {log.proof_photo_url && (
                                        <div className="w-full md:w-48 h-32 rounded-2xl overflow-hidden shadow-lg border-2 border-white relative group/photo">
                                            <img src={log.proof_photo_url} alt="Proof" className="w-full h-full object-cover transition duration-500 group-hover/photo:scale-110" />
                                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-[8px] text-white font-black uppercase text-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                                                Verification Photo <FaCamera className="inline ml-1" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content: Medicines (Requirement 6) */}
            {activeTab === 'meds' && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {assignedMeds.map((as) => (
                        <div key={as.id} className="bg-white p-6 rounded-[2rem] border-2 border-emerald-50 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                                    <FaPills />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-gray-800 truncate">{as.medicine?.name}</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{as.medicine?.category}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase">Dosage</span>
                                    <span className="text-gray-900 font-black">{as.dosage}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-gray-400 font-bold uppercase">Frequency</span>
                                    <span className="text-emerald-600 font-black">{as.frequency} Times/Day</span>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Instructions</p>
                                    <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{as.instructions || 'Standard usage'}"</p>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <div className="text-[10px] font-black text-gray-400 uppercase">Until {as.end_date}</div>
                                    <FaCheck className="text-emerald-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {assignedMeds.length === 0 && (
                        <div className="col-span-full py-16 text-center text-gray-300 font-black uppercase tracking-widest bg-gray-50 border-2 border-dashed rounded-3xl">
                            No active medications assigned.
                        </div>
                    )}
                </div>
            )}

            {/* Assignment Modal (Requirement 6) */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white">
                        <div className="bg-emerald-600 p-8 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-black">Assign New Medication</h3>
                                <p className="text-emerald-100 text-sm font-bold opacity-80 uppercase tracking-tighter">Adding to {patient?.full_name}'s "My Store"</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="bg-white/20 hover:bg-white/40 p-3 rounded-full transition"><FaTimes /></button>
                        </div>

                        <form onSubmit={handleAssign} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Medicine from Inventory</label>
                                <select
                                    required
                                    value={assignForm.medicine_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, medicine_id: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-emerald-100 transition font-bold"
                                >
                                    <option value="">-- Choose available stock --</option>
                                    {inventory.map(med => (
                                        <option key={med.id} value={med.id}>{med.name} (Stock: {med.current_stock})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Dosage (Units)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. 1 Tablet"
                                        value={assignForm.dosage}
                                        onChange={(e) => setAssignForm({ ...assignForm, dosage: e.target.value })}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Frequency (Daily)</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="6"
                                        value={assignForm.frequency}
                                        onChange={(e) => setAssignForm({ ...assignForm, frequency: parseInt(e.target.value) })}
                                        className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Special Instructions</label>
                                <textarea
                                    rows={3}
                                    placeholder="After lunch, avoid alcohol, etc."
                                    value={assignForm.instructions}
                                    onChange={(e) => setAssignForm({ ...assignForm, instructions: e.target.value })}
                                    className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold outline-none resize-none"
                                ></textarea>
                            </div>

                            <button type="submit" className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-black transition-all active:scale-95">
                                Confirm Assignment
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
