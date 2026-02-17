import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaCheckCircle, FaCalendarAlt, FaCalendarCheck, FaTimes } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";

export default function CalendarPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [todayMeds, setTodayMeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Check-in modal state
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (user) loadCalendarData();
    }, [user]);

    const loadCalendarData = async () => {
        setLoading(true);
        try {
            const { data: assignments } = await supabase
                .from('assigned_medicines')
                .select(`
                    id,
                    start_date,
                    end_date,
                    time_schedule,
                    medicines (name)
                `)
                .eq('patient_id', user!.id)
                .eq('status', 'active');

            const { data: logs } = await supabase
                .from('medication_logs')
                .select('*')
                .eq('patient_id', user!.id);

            const calendarEvents: any[] = [];
            const today = new Date().toISOString().split('T')[0];
            const medsForToday: any[] = [];

            (assignments || []).forEach((asgn: any) => {
                const startDate = new Date(asgn.start_date);
                const endDate = new Date(asgn.end_date);
                const sched = asgn.time_schedule;
                const medName = asgn.medicines?.name || 'Medicine';

                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];

                    ['morning', 'afternoon', 'evening', 'night'].forEach(slot => {
                        if (sched[slot]) {
                            const log = (logs || []).find(l => l.date === dateStr && l.assigned_medicine_id === asgn.id && l.time_slot === slot);
                            const isTaken = log?.taken;

                            const event = {
                                id: `${asgn.id}-${dateStr}-${slot}`,
                                title: `${medName} (${slot[0].toUpperCase()})`,
                                start: dateStr,
                                backgroundColor: isTaken ? '#10b981' : (dateStr < today ? '#ef4444' : '#6366f1'),
                                borderColor: 'transparent',
                                extendedProps: {
                                    asgnId: asgn.id,
                                    medName,
                                    slot,
                                    date: dateStr,
                                    status: isTaken ? 'Taken' : (dateStr < today ? 'Missed' : 'Pending')
                                }
                            };
                            calendarEvents.push(event);

                            if (dateStr === today) {
                                medsForToday.push({ ...event.extendedProps });
                            }
                        }
                    });
                }
            });

            setEvents(calendarEvents);
            setTodayMeds(medsForToday);
        } catch (error) {
            console.error("Error loading calendar data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info: any) => {
        const props = info.event.extendedProps;
        const today = new Date().toISOString().split('T')[0];

        if (props.date !== today) {
            if (props.date < today) {
                toast.info("Past records are read-only.");
            } else {
                toast.info("Future schedules cannot be checked in yet.");
            }
            return;
        }

        if (props.status === 'Pending' || props.status === 'Missed') {
            setSelectedEvent(props);
            setShowModal(true);
        } else {
            toast.success(`${props.medName} was taken already!`);
        }
    };

    const confirmCheckIn = async () => {
        if (!selectedEvent) return;
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('medication_logs')
                .insert([{
                    patient_id: user!.id,
                    assigned_medicine_id: selectedEvent.asgnId,
                    date: selectedEvent.date,
                    time_slot: selectedEvent.slot,
                    taken: true,
                    taken_at: new Date().toISOString()
                }]);

            if (error) throw error;
            toast.success(`Check-in complete for ${selectedEvent.medName}`);
            setShowModal(false);
            loadCalendarData();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10">
            <ToastContainer />

            {/* Quick Action Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-black text-gray-800 tracking-tight">Medicine Check-in</h3>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Direct confirmation</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                <FaTimes className="text-gray-400" />
                            </button>
                        </div>

                        <div className="bg-emerald-50 p-6 rounded-3xl mb-8 border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Confirming intake for:</p>
                            <p className="text-xl font-black text-gray-800">{selectedEvent?.medName}</p>
                            <div className="flex gap-4 mt-2">
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Slot: {selectedEvent?.slot}</p>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">Date: {selectedEvent?.date}</p>
                            </div>
                        </div>

                        <button
                            onClick={confirmCheckIn}
                            disabled={submitting}
                            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 transition shadow-xl shadow-emerald-200 disabled:opacity-50"
                        >
                            {submitting ? "Processing..." : "Mark as Taken"}
                        </button>
                    </div>
                </div>
            )}

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center">
                        <FaCalendarAlt className="mr-3 text-emerald-500" /> Medication Calendar
                    </h1>
                    <p className="text-gray-500 font-medium tracking-tight">Click on a pending dose to check it in instantly.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                        <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center">
                            <FaCalendarCheck className="mr-2 text-emerald-500" /> Today's Snapshot
                        </h3>
                        <div className="space-y-4">
                            {todayMeds.length === 0 ? (
                                <p className="text-gray-400 font-bold italic text-center py-8">Free day! No meds.</p>
                            ) : (
                                todayMeds.map((med, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => med.status !== 'Taken' && (setSelectedEvent(med), setShowModal(true))}
                                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] ${med.status === 'Taken' ? 'bg-emerald-50/50 border-emerald-100 opacity-60' : 'bg-white border-gray-100 shadow-sm'}`}
                                    >
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${med.status === 'Taken' ? 'text-emerald-500' : 'text-blue-500'}`}>{med.slot}</p>
                                            <p className="font-bold text-gray-800">{med.medName}</p>
                                        </div>
                                        {med.status === 'Taken' ? <FaCheckCircle className="text-emerald-500" /> : <div className="h-5 w-5 rounded-full border-2 border-blue-100"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-slate-400">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Color Codes</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center text-sm font-bold">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div> <span className="text-slate-200">Adhered</span>
                            </li>
                            <li className="flex items-center text-sm font-bold">
                                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div> <span className="text-slate-200">Scheduled</span>
                            </li>
                            <li className="flex items-center text-sm font-bold">
                                <div className="w-3 h-3 bg-rose-500 rounded-full mr-3"></div> <span className="text-slate-200">Not Taken</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="xl:col-span-3 bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-gray-100 calendar-premium">
                    {loading ? (
                        <div className="h-[600px] flex items-center justify-center">
                            <div className="animate-spin h-12 w-12 border-b-2 border-emerald-500 rounded-full"></div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            height="auto"
                            eventClassNames="rounded-lg px-2 py-1 font-bold text-[10px] cursor-pointer hover:scale-105 transition-all shadow-sm border-none"
                            dayMaxEvents={true}
                            eventClick={handleEventClick}
                        />
                    )}
                </div>
            </div>

            <style>{`
                .calendar-premium .fc-toolbar-title { font-weight: 900 !important; color: #1f2937 !important; text-transform: uppercase; letter-spacing: -0.05em; font-size: 1.5rem !important; }
                .calendar-premium .fc-button { background: #f8fafc !important; border: 2px solid #f1f5f9 !important; color: #64748b !important; font-weight: 800 !important; border-radius: 1rem !important; text-transform: uppercase; font-size: 10px !important; padding: 12px 20px !important; }
                .calendar-premium .fc-button-active { background: #10b981 !important; color: white !important; border-color: #10b981 !important; }
                .calendar-premium .fc-theme-standard td, .calendar-premium .fc-theme-standard th { border-color: #f1f5f9 !important; }
                .calendar-premium .fc-day-today { background: #f0fdfa !important; }
                .calendar-premium .fc-col-header-cell-cushion { color: #94a3b8 !important; font-weight: 900 !important; text-transform: uppercase; font-size: 10px !important; letter-spacing: 0.1em; }
            `}`</style>
        </div>
    );
}
