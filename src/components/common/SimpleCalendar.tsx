import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface CalendarProps {
    events?: { date: string; status: 'completed' | 'missed' | 'pending' }[];
    onDateClick?: (date: Date) => void;
    onMonthChange?: (date: Date) => void;
}

const SimpleCalendar: React.FC<CalendarProps> = ({ events = [], onDateClick, onMonthChange }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
        if (onMonthChange) onMonthChange(newDate);
    };

    const getStatusForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.find(e => e.date === dateStr)?.status;
    };

    const renderDays = () => {
        const days = [];
        const totalDays = daysInMonth(currentDate);
        const startDay = firstDayOfMonth(currentDate);
        const today = new Date();

        // Empty slots for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        // Days of current month
        for (let day = 1; day <= totalDays; day++) {
            const status = getStatusForDate(day);
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = date.toDateString() === today.toDateString();
            const isFuture = date > today;

            let statusClass = "text-gray-700 hover:bg-emerald-50";

            if (status === 'completed') statusClass = "bg-emerald-500 text-white font-bold";
            else if (status === 'missed') statusClass = "bg-red-500 text-white font-bold";
            else if (status === 'pending') statusClass = "bg-yellow-400 text-white font-bold";

            // Disable future dates visually
            if (isFuture) statusClass = "text-gray-300 cursor-not-allowed";

            days.push(
                <button
                    key={day}
                    onClick={() => {
                        if (!isFuture && onDateClick) onDateClick(date);
                    }}
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition text-sm ${statusClass} ${isToday && !status ? 'border-2 border-emerald-500 text-emerald-600 font-bold' : ''}`}
                    disabled={isFuture}
                >
                    {day}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-auto border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                        <FaChevronLeft />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition">
                        <FaChevronRight />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-2 place-items-center">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                        {d}
                    </div>
                ))}
                {renderDays()}
            </div>

            <div className="mt-6 flex justify-around text-xs text-gray-500 border-t pt-4 border-gray-100">
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Completed
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div> Missed
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div> Pending
                </div>
            </div>
        </div>
    );
};

export default SimpleCalendar;
