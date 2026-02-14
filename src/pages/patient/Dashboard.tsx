import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardStats, fetchVitalsHistory, fetchMedicationAdherence } from "../../services/statsService";
import StatCard from "../../components/common/StatCard";
import { FaPills, FaHeartbeat, FaCalendarCheck, FaChartLine } from "react-icons/fa";
import {  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function PatientDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [vitalsData, setVitalsData] = useState<any[]>([]);
    // const [adherenceData, setAdherenceData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadDashboardData();
    }, [user]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const [s, v] = await Promise.all([
                fetchDashboardStats(user!.id, 'patient'),
                fetchVitalsHistory(user!.id),
                fetchMedicationAdherence(user!.id)
            ]);
            setStats(s);
            setVitalsData(v);
            // setAdherenceData(a);
        } catch (error) {
            console.error("Dashboard load error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-full">Loading Dashboard...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Welcome Back!</h1>
                    <p className="text-gray-500">Here's your health summary for today.</p>
                </div>
                <div className="flex items-center space-x-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-emerald-700 font-medium">Monitoring Active</span>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Medicines Today"
                    value={stats?.todayMeds || 0}
                    icon={<FaPills className="text-xl" />}
                    color="bg-emerald-500"
                    subtitle="2 doses remaining"
                />
                <StatCard
                    title="Compliance Rate"
                    value={`${stats?.todayMeds > 0 ? Math.round((stats.completedToday / stats.todayMeds) * 100) : 0}%`}
                    icon={<FaCalendarCheck className="text-xl" />}
                    color="bg-blue-500"
                    subtitle="Last 24 hours"
                />
                <StatCard
                    title="Avg Heart Rate"
                    value={vitalsData.length > 0 ? Math.round(vitalsData.reduce((acc, curr) => acc + curr.heartRate, 0) / vitalsData.length) : "--"}
                    icon={<FaHeartbeat className="text-xl" />}
                    color="bg-rose-500"
                    subtitle="BPM"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Vitals Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <FaChartLine className="mr-2 text-rose-500" /> Vitals History
                        </h2>
                        <select className="bg-gray-50 border-none text-sm rounded-lg px-3 py-1 text-gray-600 outline-none">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={vitalsData.length > 0 ? vitalsData : [{ date: 'No Data', heartRate: 0 }]}>
                                <defs>
                                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Medication Calendar */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                        <FaCalendarCheck className="mr-2 text-emerald-500" /> Medication Calendar
                    </h2>
                    <div className="calendar-container h-[400px]">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next',
                                center: 'title',
                                right: ''
                            }}
                            height="100%"
                            events={[
                                { title: 'Dose Taken', date: new Date().toISOString().split('T')[0], color: '#10b981' }
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
