import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchDashboardStats, fetchInventoryWithDetails } from "../../services/statsService";
import { fetchConnections } from "../../services/connectionService";
import StatCard from "../../components/common/StatCard";
import { FaUserInjured, FaExclamationTriangle, FaClipboardList, FaUserPlus, FaArrowRight, FaPills, FaFlask } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Link } from "react-router-dom";

export default function CaretakerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [patients, setPatients] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadCaretakerData();
    }, [user]);

    const loadCaretakerData = async () => {
        setLoading(true);
        try {
            const [s, p, inv] = await Promise.all([
                fetchDashboardStats(user!.id, 'caretaker'),
                fetchConnections(user!.id, 'caretaker'),
                fetchInventoryWithDetails(user!.id)
            ]);
            setStats(s);
            setPatients(p || []);
            setInventory(inv || []);
        } catch (error) {
            console.error("Caretaker Dashboard load error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Caretaker Control Panel</h1>
                    <p className="text-gray-500">Monitor your patients and manage medical supplies efficiently.</p>
                </div>
                <div className="flex space-x-3">
                    <Link to="/caretaker/find-patients" className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition flex items-center font-medium shadow-lg shadow-blue-200">
                        <FaUserPlus className="mr-2" /> Add Patient
                    </Link>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Active Patients"
                    value={stats?.patientCount || 0}
                    icon={<FaUserInjured className="text-xl" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Pending Requests"
                    value={stats?.requestCount || 0}
                    icon={<FaClipboardList className="text-xl" />}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Low Stock Alerts"
                    value={stats?.lowStockCount || 0}
                    icon={<FaExclamationTriangle className="text-xl" />}
                    color="bg-red-500"
                    subtitle="Items < 20 units"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Real Inventory Stock Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <FaFlask className="mr-2 text-blue-500" /> Stock Inventory (Real Data)
                        </h2>
                        <Link to="/caretaker/inventory" className="text-blue-600 text-sm font-bold hover:underline">Full Inventory</Link>
                    </div>
                    {inventory.length > 0 ? (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventory}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value, name) => [value, name === 'current_stock' ? 'Quantity' : name]}
                                    />
                                    <Bar dataKey="current_stock" radius={[6, 6, 0, 0]}>
                                        {inventory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.current_stock < 20 ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                            <FaPills className="text-4xl mb-2 opacity-20" />
                            <p>No inventory data available.</p>
                        </div>
                    )}
                </div>

                {/* Patient List with Quick Actions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Your Patients</h2>
                        <Link to="/caretaker/patients" className="text-blue-600 text-sm font-bold hover:underline">Manage All</Link>
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                        {patients.length > 0 ? patients.map((conn: any) => (
                            <div key={conn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition border border-transparent hover:border-blue-100 group">
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {conn.profile?.full_name?.charAt(0) || 'P'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{conn.profile?.full_name || 'Patient'}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className={`h-2 w-2 rounded-full ${conn.profile?.availability_status === 'available' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            <p className="text-xs text-gray-500 uppercase font-bold tracking-tighter">
                                                {conn.profile?.availability_status || 'Offline'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link
                                        to={`/caretaker/patients/${conn.profile?.id}`}
                                        className="p-2 bg-white text-blue-600 rounded-lg shadow-sm hover:bg-blue-600 hover:text-white transition"
                                        title="View Records"
                                    >
                                        <FaClipboardList />
                                    </Link>
                                    <Link
                                        to="/caretaker/inventory"
                                        className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-600 hover:text-white transition"
                                        title="Assign Med"
                                    >
                                        <FaPills />
                                    </Link>
                                </div>
                                <Link to={`/caretaker/patients/${conn.profile?.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition ml-2">
                                    <FaArrowRight />
                                </Link>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-400">No connected patients yet.</p>
                                <Link to="/caretaker/find-patients" className="text-blue-600 text-sm font-bold mt-2 inline-block">Find your first patient</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Inventory Detail Grid (Requirement 1) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Stock Inventory Details</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Medicine</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Qty Available</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Patients</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.map((med) => (
                                <tr key={med.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{med.name}</div>
                                        <div className="text-xs text-gray-500">{med.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${med.current_stock < 20 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                            {med.current_stock} units
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-sm text-gray-700 font-medium">{med.assignedPatientCount} Patients</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {med.current_stock < 20 ? (
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center w-fit">
                                                <FaExclamationTriangle className="mr-1" /> Low Stock
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold w-fit inline-block">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {inventory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">No inventory records found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
