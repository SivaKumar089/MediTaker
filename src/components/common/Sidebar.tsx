import { Link, useLocation } from "react-router-dom";
import {
    FaHome, FaUserInjured, FaPills,
    FaUserPlus, FaUserCog, FaCalendarAlt, FaCheckSquare,
    FaCommentDots, FaStore, FaHeartbeat, FaChevronLeft, FaTimes, FaClipboardList
} from "react-icons/fa";

interface SidebarProps {
    role: "caretaker" | "patient";
    isOpen: boolean;
    toggleSidebar: () => void;
}

export default function Sidebar({ role, isOpen, toggleSidebar }: SidebarProps) {
    const location = useLocation();

    const theme = role === "caretaker" ? "bg-slate-900" : "bg-emerald-950";
    const accent = role === "caretaker" ? "bg-blue-600" : "bg-emerald-600";
    const hoverItem = role === "caretaker" ? "hover:bg-slate-800" : "hover:bg-emerald-900";
    const shadowColor = role === "caretaker" ? "shadow-blue-500/20" : "shadow-emerald-500/20";

    const commonLinks = [
        { name: "Messages", path: `/${role}/messages`, icon: <FaCommentDots /> },
        { name: "Profile", path: `/${role}/profile`, icon: <FaUserCog /> },
    ];

    const caretakerLinks = [
        { name: "Dashboard", path: "/caretaker/dashboard", icon: <FaHome /> },
        { name: "My Patients", path: "/caretaker/patients", icon: <FaUserInjured /> },
        { name: "Medical Store", path: "/caretaker/inventory", icon: <FaStore /> },
        { name: "Find Patients", path: "/caretaker/find-patients", icon: <FaUserPlus /> },
        { name: "Requests", path: "/caretaker/requests", icon: <FaClipboardList /> },
        ...commonLinks
    ];

    const patientLinks = [
        { name: "Dashboard", path: "/patient/dashboard", icon: <FaHome /> },
        { name: "Daily Check", path: "/patient/checkin", icon: <FaCheckSquare /> },
        { name: "Health Records", path: "/patient/health", icon: <FaHeartbeat /> },
        { name: "Medication Calendar", path: "/patient/calendar", icon: <FaCalendarAlt /> },
        { name: "My Medicines", path: "/patient/medicines", icon: <FaPills /> },
        { name: "Caretaker Hub", path: "/patient/caretakers", icon: <FaUserPlus /> },
        { name: "Requests", path: "/patient/requests", icon: <FaClipboardList /> },
        ...commonLinks
    ];

    const links = role === "caretaker" ? caretakerLinks : patientLinks;

    return (
        <>
            {/* Overlay for Mobile */}
            <div
                className={`fixed inset-0 bg-slate-950/40 lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
                onClick={toggleSidebar}
            />

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 ${theme} text-slate-300 
                transition-transform duration-300 ease-in-out z-[70]
                ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"} 
                lg:translate-x-0 lg:fixed`}
            >
                {/* Logo */}
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white text-xl shadow-lg ${accent} ${shadowColor}`}>
                            <FaPills />
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight">
                            MediCare<span className="text-emerald-500">.</span>
                        </h2>
                    </div>

                    <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                {/* Menu */}
                <nav className="mt-6 px-4 space-y-1.5 overflow-y-auto h-[calc(100vh-220px)]">
                    <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                        Menu
                    </p>

                    {links.map((link) => {
                        const isActive = location.pathname.startsWith(link.path);

                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                                className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                                    ? `${accent} text-white shadow-xl ${shadowColor}`
                                    : `text-slate-400 ${hoverItem} hover:text-white`
                                    }`}
                            >
                                <span className={`text-lg mr-4 transition-transform group-hover:scale-110 ${isActive ? "text-white" : "text-slate-500 group-hover:text-white"}`}>
                                    {link.icon}
                                </span>

                                <span className="font-bold text-sm tracking-tight">
                                    {link.name}
                                </span>

                                {isActive && (
                                    <FaChevronLeft className="ml-auto text-[10px] opacity-50" />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="absolute bottom-6 left-4 right-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-xl ${accent} flex items-center justify-center text-white font-black`}>
                            {role[0].toUpperCase()}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate uppercase tracking-wider">
                                {role} Portal
                            </p>
                            <div className="flex items-center mt-0.5">
                                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                                <p className="text-[9px] text-slate-500 font-bold uppercase truncate">
                                    System Active
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
