import type { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    color: string;
    subtitle?: string;
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group duration-500">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-4 rounded-2xl ${color} text-white shadow-lg shadow-opacity-10 group-hover:scale-110 transition-transform`}>
                    {icon}
                </div>
                {subtitle && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">{subtitle}</span>}
            </div>
            <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">{title}</h3>
                <p className="text-3xl font-black text-gray-800 mt-1">{value}</p>
            </div>
            <div className="mt-4 h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
                <div className={`h-full ${color} w-2/3 opacity-30 rounded-full`}></div>
            </div>
        </div>
    );
}
