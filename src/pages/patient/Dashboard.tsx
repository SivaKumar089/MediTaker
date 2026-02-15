import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardStats, fetchVitalsHistory } from "../../services/statsService";
import { supabase } from "../../services/supabase";
import StatCard from "../../components/common/StatCard";
import { FaPills, FaHeartbeat, FaCalendarCheck, FaChartLine, FaThermometerHalf, FaTint } from "react-icons/fa";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [vitalsData, setVitalsData] = useState<any[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [vitalsRange, setVitalsRange] = useState(7); // Default 7 days

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user, vitalsRange]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [s, v] = await Promise.all([
                fetchDashboardStats(user!.id, 'patient'),
                fetchVitalsHistory(user!.id, vitalsRange)
            ]);
            setStats(s);
            setVitalsData(v);

            // Load Calendar Data
            await loadCalendarData();
        } catch (error) {
            console.error("Dashboard load error", error);
        } finally {
            setLoading(false);
        }
    };

    const loadCalendarData = async () => {
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

        const events: any[] = [];
        (assignments || []).forEach((asgn: any) => {
            const startDate = new Date(asgn.start_date);
            const endDate = new Date(asgn.end_date);
            const sched = asgn.time_schedule;
            const medName = asgn.medicines?.name || 'Medicine';

            // Only show events for current month to keep dashboard light
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                if (d < startOfMonth || d > endOfMonth) continue;

                const dateStr = d.toISOString().split('T')[0];
                ['morning', 'afternoon', 'evening', 'night'].forEach(slot => {
                    if (sched[slot]) {
                        const log = (logs || []).find(l => l.date === dateStr && l.assigned_medicine_id === asgn.id && l.time_slot === slot);
                        events.push({
                            title: `${medName} (${slot[0].toUpperCase()})`,
                            start: dateStr,
                            color: log?.taken ? '#10b981' : (dateStr < new Date().toISOString().split('T')[0] ? '#ef4444' : '#6366f1'),
                        });
                    }
                });
            }
        });
        setCalendarEvents(events);
    };

    const parseBP = (bp: string | null) => {
        if (!bp) return null;
        const parts = bp.split('/');
        return parts.length === 2 ? parseInt(parts[0]) : null; // Represent by Systolic
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
            <p className="text-slate-500 font-bold animate-pulse">Synchronizing Health Data...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Patient <span className="text-emerald-600">Overview</span></h1>
                    <p className="text-slate-500 font-medium">Monitoring your health journey and medication adherence.</p>
                </div>
                <div className="flex items-center space-x-3 bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">System Active</span>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard
                    title="Active Medications"
                    value={stats?.todayMeds || 0}
                    icon={<FaPills className="text-xl" />}
                    color="bg-emerald-500"
                    subtitle={`${stats?.completedToday || 0} doses taken today`}
                />
                <StatCard
                    title="Monthly Adherence"
                    value={`${stats?.todayMeds > 0 ? Math.round((stats.completedToday / stats.todayMeds) * 100) : 0}%`}
                    icon={<FaCalendarCheck className="text-xl" />}
                    color="bg-blue-600"
                    subtitle="Based on active logs"
                />
                <StatCard
                    title="Latest Heart Rate"
                    value={vitalsData.length > 0 ? vitalsData[vitalsData.length - 1].heartRate || "--" : "--"}
                    icon={<FaHeartbeat className="text-xl" />}
                    color="bg-rose-500"
                    subtitle="BPM (Latest Recorded)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Vitals Chart */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
                        <h2 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
                            <FaChartLine className="mr-3 text-rose-500" /> Vitals History
                        </h2>
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setVitalsRange(7)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${vitalsRange === 7 ? 'bg-white text-slate-800 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                DAILY
                            </button>
                            <button
                                onClick={() => setVitalsRange(30)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${vitalsRange === 30 ? 'bg-white text-slate-800 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                MONTHLY
                            </button>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vitalsData.map(v => ({
                                ...v,
                                bp: parseBP(v.bloodPressure)
                            }))}>
                                <defs>
                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                    <linearGradient id="colorSugar" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }} />
                                <Area name="Heart Rate" type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorHr)" />
                                <Area name="Blood Pressure" type="monotone" dataKey="bp" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorBp)" />
                                <Area name="Sugar Level" type="monotone" dataKey="sugarLevel" stroke="#8b5cf6" strokeWidth={4} fillOpacity={1} fill="url(#colorSugar)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                            <FaHeartbeat className="text-rose-500 mb-2" />
                            <p className="text-[10px] font-black text-rose-400 uppercase">Heart Rate</p>
                            <p className="text-lg font-black text-rose-700">{vitalsData[vitalsData.length - 1]?.heartRate || '--'} <span className="text-[10px]">BPM</span></p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <FaChartLine className="text-blue-500 mb-2" />
                            <p className="text-[10px] font-black text-blue-400 uppercase">BP</p>
                            <p className="text-lg font-black text-blue-700">{vitalsData[vitalsData.length - 1]?.bloodPressure || '--'}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <FaTint className="text-purple-500 mb-2" />
                            <p className="text-[10px] font-black text-purple-400 uppercase">Sugar</p>
                            <p className="text-lg font-black text-purple-700">{vitalsData[vitalsData.length - 1]?.sugarLevel || '--'} <span className="text-[10px]">mg/dL</span></p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                            <FaThermometerHalf className="text-amber-500 mb-2" />
                            <p className="text-[10px] font-black text-amber-400 uppercase">Temp</p>
                            <p className="text-lg font-black text-amber-700">{vitalsData[vitalsData.length - 1]?.temperature || '--'} <span className="text-[10px]">°C</span></p>
                        </div>
                    </div>
                </div>

                {/* Medication Calendar */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center tracking-tight">
                        <FaCalendarCheck className="mr-3 text-emerald-500" /> Medication Calendar
                    </h2>
                    <div className="calendar-premium calendar-compact h-[500px]">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next',
                                center: 'title',
                                right: ''
                            }}
                            height="100%"
                            events={calendarEvents}
                            eventClassNames="text-[9px] font-black px-1.5 rounded-lg border-none hover:scale-105 transition-transform cursor-pointer"
                        />
                    </div>
                </div>
            </div>

            <style>{`
                .calendar-premium .fc-toolbar-title { font-weight: 900 !important; color: #1f2937 !important; text-transform: uppercase; letter-spacing: -0.05em; font-size: 1rem !important; }
                .calendar-premium .fc-button { background: #f8fafc !important; border: 1px solid #f1f5f9 !important; color: #64748b !important; font-weight: 800 !important; border-radius: 0.75rem !important; font-size: 10px !important; padding: 8px 12px !important; }
                .calendar-premium .fc-col-header-cell-cushion { color: #94a3b8 !important; font-weight: 900 !important; text-transform: uppercase; font-size: 9px !important; letter-spacing: 0.1em; }
                .calendar-premium .fc-day-today { background: #f0fdfa !important; }
            `}</style>
        </div>
    );
}

