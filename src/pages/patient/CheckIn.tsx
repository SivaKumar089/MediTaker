import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { toast, ToastContainer } from "react-toastify";
import { FaCheckCircle, FaCamera, FaTimes, FaImage, FaCalendarCheck } from "react-icons/fa";

export default function CheckIn() {
    const { user } = useAuth();
    const [medicines, setMedicines] = useState<any[]>([]);
    const [selectedMed, setSelectedMed] = useState("");
    const [timeSlot, setTimeSlot] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Photo upload state
    const [photo, setPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) fetchMeds();
    }, [user]);

    const fetchMeds = async () => {
        const { data } = await supabase
            .from('assigned_medicines')
            .select(`
                id,
                medicines (name)
            `)
            .eq('patient_id', user!.id)
            .eq('status', 'active');
        setMedicines(data || []);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Photo size should be less than 5MB");
                return;
            }
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setPhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMed) return toast.error("Please select a medicine");
        if (!timeSlot) return toast.error("Please select a time slot");

        setSubmitting(true);
        try {
            let photoUrl = null;

            // 1. Upload photo if exists
            if (photo) {
                const fileExt = photo.name.split('.').pop();
                const fileName = `${user!.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('medication-proofs')
                    .upload(fileName, photo);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('medication-proofs')
                    .getPublicUrl(fileName);

                photoUrl = urlData.publicUrl;
            }

            // 2. Insert log
            const { error } = await supabase
                .from('medication_logs')
                .insert([{
                    patient_id: user!.id,
                    assigned_medicine_id: selectedMed,
                    date: new Date().toISOString().split('T')[0],
                    time_slot: timeSlot,
                    taken: true,
                    taken_at: new Date().toISOString(),
                    notes: notes || null,
                    proof_photo_url: photoUrl
                }]);

            if (error) throw error;

            toast.success("Health check-in logged successfully!");
            setSelectedMed("");
            setTimeSlot("");
            setNotes("");
            removePhoto();
        } catch (error: any) {
            toast.error(error.message || "Failed to log check-in");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            <ToastContainer />
            <header className="text-center">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Daily Medication Check</h1>
                <p className="text-gray-500 font-medium mt-1">Keep your caretaker updated with your progress.</p>
            </header>

            <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-100/50 border border-gray-100 space-y-8">
                {/* Medicine Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Current Medication</label>
                    <div className="relative">
                        <select
                            value={selectedMed}
                            onChange={(e) => setSelectedMed(e.target.value)}
                            className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all appearance-none font-bold text-gray-700"
                        >
                            <option value="">-- Choose Medicine --</option>
                            {medicines.map(m => (
                                <option key={m.id} value={m.id}>{m.medicines?.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                            ▼
                        </div>
                    </div>
                </div>

                {/* Time Slot Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Time Slot</label>
                    <div className="flex flex-wrap gap-3">
                        {['morning', 'afternoon', 'evening', 'night'].map((slot) => (
                            <button
                                key={slot}
                                type="button"
                                onClick={() => setTimeSlot(slot)}
                                className={`px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-widest transition-all ${timeSlot === slot ? 'bg-emerald-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                            >
                                {slot}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Proof Photo Upload */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Proof Photo (Optional)</label>
                    {!photoPreview ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-4 border-dashed border-gray-100 rounded-[2rem] p-8 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group"
                        >
                            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition">
                                <FaCamera />
                            </div>
                            <p className="font-bold text-gray-500 group-hover:text-emerald-700">Tap to upload proof photo</p>
                            <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-tighter">JPG, PNG up to 5MB</p>
                        </div>
                    ) : (
                        <div className="relative rounded-[2rem] overflow-hidden border-4 border-emerald-100 group shadow-xl">
                            <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={removePhoto}
                                    className="bg-white text-red-600 p-4 rounded-full shadow-lg hover:scale-110 transition active:scale-90"
                                >
                                    <FaTimes className="text-xl" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl flex items-center shadow-lg">
                                <FaImage className="text-emerald-500 mr-2" />
                                <span className="text-xs font-bold text-gray-700 truncate">{photo?.name}</span>
                            </div>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoChange}
                        className="hidden"
                        accept="image/*"
                    />
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <label className="text-sm font-black text-gray-700 uppercase tracking-widest ml-1">Personal Notes</label>
                    <textarea
                        rows={3}
                        placeholder="How are you feeling after taking this medicine?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none font-medium"
                    ></textarea>
                </div>

                {/* Submit */}
                <button
                    disabled={submitting}
                    className="w-full py-6 bg-emerald-600 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center overflow-hidden relative group"
                >
                    {submitting ? (
                        <div className="flex items-center space-x-2">
                            <div className="h-5 w-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Uploading & Saving...</span>
                        </div>
                    ) : (
                        <>
                            <FaCheckCircle className="mr-3 text-2xl group-hover:scale-125 transition" />
                            <span>Complete Daily Check</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
