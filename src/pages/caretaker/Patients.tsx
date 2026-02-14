import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchConnections } from "../../services/connectionService";
import { FaUserInjured, FaPhone, FaMapMarkerAlt, FaPills, FaChartLine, FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

export default function Patients() {
    const { user } = useAuth();
    const [connections, setConnections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadPatients();
    }, [user]);

    const loadPatients = async () => {
        try {
            const data = await fetchConnections(user!.id, 'caretaker');
            setConnections(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load patients");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <ToastContainer />
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-800 tracking-tight">Your Patients</h1>
                    <p className="text-gray-500 font-medium">Monitoring and managing health records for {connections.length} patients.</p>
                </div>
                <Link to="/caretaker/find-patients" className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold shadow-xl shadow-blue-200 flex items-center">
                    <FaPlus className="mr-2" /> Find New Patient
                </Link>
            </header>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : connections.length === 0 ? (
                <div className="bg-white p-16 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 shadow-sm">
                    <div className="h-24 w-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FaUserInjured className="text-5xl" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Patients Connected</h2>
                    <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">Invite patients or accept their requests to start monitoring their health and medications.</p>
                    <Link to="/caretaker/find-patients" className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg">
                        Browse Patient Directory
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {connections.map((conn) => (
                        <div key={conn.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                            {/* Card Header */}
                            <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 flex justify-between items-start">
                                <div className="h-16 w-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-blue-600 text-2xl font-black translate-y-4 border-4 border-white">
                                    {conn.profile?.full_name?.charAt(0) || 'P'}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${conn.profile?.availability_status === 'available' ? 'bg-green-400 text-white' : 'bg-white/20 text-white shadow-sm'
                                    }`}>
                                    {conn.profile?.availability_status || 'Offline'}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="pt-12 px-6 pb-6 space-y-4">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 group-hover:text-blue-600 transition truncate">
                                        {conn.profile?.full_name || "Patient Name"}
                                    </h3>
                                    <p className="text-xs text-gray-400 font-black uppercase tracking-tighter mt-0.5">
                                        ID: {conn.id.slice(0, 8).toUpperCase()} • {conn.profile?.age ? `${conn.profile.age} Yrs` : 'Age N/A'}
                                    </p>
                                </div>

                                <div className="space-y-2 py-4 border-y border-gray-50">
                                    <div className="flex items-center text-sm font-bold text-gray-600">
                                        <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 text-blue-400">
                                            <FaPhone />
                                        </div>
                                        <span>{conn.profile?.phone || "Private Contact"}</span>
                                    </div>
                                    <div className="flex items-center text-sm font-bold text-gray-600">
                                        <div className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center mr-3 text-blue-400">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <span className="truncate">{conn.profile?.address || "Location Hidden"}</span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <Link
                                        to={`/caretaker/patients/${conn.profile?.id}`}
                                        className="flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <FaChartLine className="mr-2" /> Health Records
                                    </Link>
                                    <Link
                                        to={`/caretaker/patients/${conn.profile?.id}/assign`}
                                        className="flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <FaPills className="mr-2" /> Assign Med
                                    </Link>
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-2">
                                        <span>Daily Progress</span>
                                        <span className="text-emerald-500">75%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-3/4 shadow-sm"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
