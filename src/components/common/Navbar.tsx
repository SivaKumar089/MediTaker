import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../services/supabase";
import { FaUserCircle, FaBell, FaSignOutAlt, FaBars, FaChevronDown, FaPills, FaUser, FaShieldAlt } from "react-icons/fa";

interface NavbarProps {
    role: "caretaker" | "patient";
    toggleSidebar: () => void;
}

export default function Navbar({ role, toggleSidebar }: NavbarProps) {
    const { user, signOut, role: userRole } = useAuth();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetchNotifications();

        const channel = supabase
            .channel('global-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'connections' }, payload => {
                if (payload.new.patient_id === user?.id || payload.new.caretaker_id === user?.id) {
                    handleNewNotification('New Connection Request', 'You have a new request pending.', 'request', payload.new);
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
                if (payload.new.receiver_id === user?.id) {
                    handleNewNotification('New Message', payload.new.content || 'Sent a photo', 'message', payload.new);
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reminders' }, payload => {
                if (payload.new.patient_id === user?.id) {
                    handleNewNotification('Medication Reminder', payload.new.message, 'reminder', payload.new);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const { data: messages } = await supabase
                .from('messages')
                .select('*')
                .eq('receiver_id', user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: connections } = await supabase
                .from('connections')
                .select('*')
                .eq(role === 'patient' ? 'patient_id' : 'caretaker_id', user.id)
                .eq('status', 'pending');

            const allNotifications = [
                ...(messages || []).map(m => ({
                    id: m.id,
                    title: 'New Message',
                    message: m.content || 'Photo received',
                    read: false,
                    type: 'message',
                    data: m
                })),
                ...(connections || []).map(c => ({
                    id: c.id,
                    title: 'Connection Request',
                    message: 'A user wants to connect with you.',
                    read: false,
                    type: 'request',
                    data: c
                }))
            ];

            setNotifications(allNotifications);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    const handleNewNotification = (title: string, message: string, type: string, data?: any) => {
        setNotifications(prev => [{ id: Date.now().toString(), title, message, read: false, type, data }, ...prev]);
    };

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    return (
        <>
            <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 fixed top-0 right-0 left-0 lg:left-64 z-[50] transition-all duration-300">
                {/* Left Section: Logo & Name */}
                <div className="flex items-center space-x-4">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition focus:outline-none border border-slate-200"
                    >
                        <FaBars className="text-xl" />
                    </button>

                    <Link to={`/${role}/dashboard`} className="flex items-center space-x-3 group">
                        <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                            <FaPills />
                        </div>
                        {/* <h1>MediTaker</h1> */}
                        <div className="sm:block">
                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">Meds <span className="text-emerald-600">Buddy</span></h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Health Companion</p>
                        </div>
                    </Link>
                </div>

                {/* Right Section: Actions & Profile */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition relative group border border-transparent hover:border-slate-200"
                        >
                            <FaBell className="text-lg" />
                            {notifications.some(n => !n.read) && (
                                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 animate-in fade-in zoom-in duration-200">
                                <h3 className="text-sm font-black text-slate-800 mb-4 px-2 uppercase tracking-wider">Notifications</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs font-bold italic">
                                            All caught up!
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => {
                                                    if (n.type === 'message') navigate(`/${role}/messages/${n.data?.sender_id || ''}`);
                                                    else if (n.type === 'request') navigate(`/${role}/requests`);
                                                    setShowNotifications(false);
                                                }}
                                                className="p-3 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-md transition cursor-pointer"
                                            >
                                                <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">{n.title}</p>
                                                <p className="text-xs text-slate-600 font-bold">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Vertical Divider */}
                    <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                    {/* Profile Widget */}
                    <div className="relative">
                        <div
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
                        >
                            <div className="h-9 w-9 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center text-white shadow-lg shadow-gray-200">
                                <FaUserCircle className="text-xl" />
                            </div>
                            <div className="ml-3 hidden md:block">
                                <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[100px]">
                                    {user?.email?.split('@')[0].toUpperCase()}
                                </p>
                                <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${role === 'caretaker' ? 'text-blue-500' : 'text-emerald-500'}`}>
                                    {role}
                                </p>
                            </div>
                            <FaChevronDown className={`ml-3 text-[10px] text-slate-300 group-hover:text-slate-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
                        </div>

                        {showProfileMenu && (
                            <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-6 border-b border-slate-50">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl">
                                            <FaUser />
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 truncate">{user?.email?.split('@')[0]}</p>
                                            <p className="text-[10px] font-bold text-slate-400 truncate">{user?.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                                        <FaShieldAlt /> <span>{userRole || role} Portal</span>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <button
                                        onClick={() => { navigate(`/${role}/profile`); setShowProfileMenu(false); }}
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-sm transition"
                                    >
                                        <FaUserCircle className="text-slate-400" />
                                        <span>View Profile</span>
                                    </button>
                                    <button
                                        onClick={() => setShowLogoutConfirm(true)}
                                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-rose-50 text-rose-500 font-bold text-sm transition"
                                    >
                                        <FaSignOutAlt className="text-rose-400" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in duration-300 text-center">
                        <div className="h-20 w-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                            <FaSignOutAlt />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Wait a Minute!</h3>
                        <p className="text-slate-500 font-bold text-sm mb-8">Are you sure you want to log out of your session?</p>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-lg shadow-rose-200 hover:bg-rose-600 transition"
                            >
                                Yes, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

