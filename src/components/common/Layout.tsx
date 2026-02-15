import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
    children: React.ReactNode;
    role: "caretaker" | "patient";
}

export default function Layout({ children, role }: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">

            {/* Sidebar */}
            <Sidebar
                role={role}
                isOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">

                {/* Navbar */}
                <Navbar role={role} toggleSidebar={toggleSidebar} />

                {/* Page Content */}
                <main className="flex-1 mt-20 p-4 sm:p-6 lg:p-10">
                    <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-14rem)] bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 sm:p-8 lg:p-10">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="py-8 px-10 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
                        Meditaker Health Systems <span className="opacity-50">© 2026</span>
                    </p>
                </footer>
            </div>
        </div>
    );
}
