import { useAuth } from "../../context/AuthContext";
import { FaUserCircle, FaBell, FaSignOutAlt, FaBars, FaChevronDown } from "react-icons/fa";

interface NavbarProps {
    role: "caretaker" | "patient";
    toggleSidebar: () => void;
}

export default function Navbar({ role, toggleSidebar }: NavbarProps) {
    const { user, signOut } = useAuth();

    return (
        <nav className="h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 sm:px-8 fixed top-0 right-0 left-0 lg:left-64 z-[50] transition-all duration-300">
            {/* Left Section: Hamburger & Mobile Search/Logo */}
            <div className="flex items-center space-x-4">
                {/* Hamburger Icon - ONLY visible on Mobile/Tablet (below 1024px) */}
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition focus:outline-none border border-slate-200"
                >
                    <FaBars className="text-xl" />
                </button>

                <div className="hidden sm:block">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1">Meditaker Dashboard</p>
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Portal Overview</h2>
                </div>
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Notifications */}
                <button className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 transition relative group border border-transparent hover:border-slate-200">
                    <FaBell className="text-lg" />
                    <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Vertical Divider */}
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden sm:block"></div>

                {/* Profile Widget */}
                <div className="flex items-center bg-slate-50 p-1.5 pr-4 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group">
                    <div className="h-9 w-9 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center text-white shadow-lg shadow-gray-200">
                        <FaUserCircle className="text-xl" />
                    </div>
                    <div className="ml-3 hidden md:block">
                        <p className="text-xs font-black text-slate-800 leading-none truncate max-w-[100px]">
                            {user?.email?.split('@')[0].toUpperCase()}
                        </p>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${role === 'caretaker' ? 'text-blue-500' : 'text-emerald-500'}`}>Verified</p>
                    </div>
                    <FaChevronDown className="ml-3 text-[10px] text-slate-300 group-hover:text-slate-500 transition-colors hidden md:block" />
                </div>

                {/* Sign Out */}
                <button
                    onClick={() => signOut()}
                    className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-rose-100 border border-rose-100 hover:border-rose-500"
                    title="Sign Out"
                >
                    <FaSignOutAlt className="text-lg" />
                </button>
            </div>
        </nav>
    );
}
