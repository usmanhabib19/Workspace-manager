import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveDetailTask } from '../../store/TaskSlice';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function CalendarView() {
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const tasks = useSelector((state) => state.tasks.tasks);
    const filters = useSelector((state) => state.ui.filters);
    const searchQuery = useSelector((state) => state.ui.searchQuery);

    const dispatch = useDispatch();

    const [currentDate, setCurrentDate] = useState(new Date('2026-09-01'));

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

    const filteredTasks = projectTasks.filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.tag.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.assignee !== 'all' && task.assigneeId !== filters.assignee) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.status !== 'all' && task.columnId !== filters.status) return false;
        return true;
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    // Build calendar grid days
    const calendarDays = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarDays.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        calendarDays.push({ day: d, dateStr: `${year}-${monthStr}-${dayStr}` });
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden font-sans">
            
            {/* Header / Month Navigation */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-neutral-50/50 dark:bg-gray-950/40">
                <div className="flex items-center space-x-2">
                    <CalendarIcon size={18} className="text-primary" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {monthNames[month]} {year}
                    </h3>
                </div>

                <div className="flex items-center space-x-1.5">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-neutral-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date('2026-09-01'))}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-neutral-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-neutral-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Days of Week Row */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 text-center py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-neutral-50/70 dark:bg-gray-950/70">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>

            {/* Calendar Days Grid */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr divide-x divide-y divide-gray-200 dark:divide-gray-800/80 overflow-y-auto">
                {calendarDays.map((calDay, idx) => {
                    const dayTasks = calDay.dateStr
                        ? filteredTasks.filter(t => t.dueDate === calDay.dateStr)
                        : [];

                    return (
                        <div
                            key={idx}
                            className={`min-h-[110px] p-2 flex flex-col justify-between ${
                                calDay.day ? 'bg-white dark:bg-gray-900' : 'bg-neutral-50/40 dark:bg-gray-950/40'
                            }`}
                        >
                            {calDay.day && (
                                <>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            {calDay.day}
                                        </span>
                                        {dayTasks.length > 0 && (
                                            <span className="text-[10px] text-primary font-bold">
                                                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Task badges */}
                                    <div className="space-y-1 flex-1 overflow-y-auto max-h-24">
                                        {dayTasks.map(task => (
                                            <div
                                                key={task.id}
                                                onClick={() => dispatch(setActiveDetailTask(task.id))}
                                                className="p-1 px-1.5 rounded-md text-[10px] font-medium bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/80 dark:hover:bg-teal-900 text-primary truncate cursor-pointer transition-colors border border-teal-200/60 dark:border-teal-800/60 shadow-2xs"
                                                title={task.title}
                                            >
                                                {task.title}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
