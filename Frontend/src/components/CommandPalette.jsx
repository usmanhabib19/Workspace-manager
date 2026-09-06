import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCommandPaletteOpen, setActiveView, toggleTheme, addToast } from '../store/UiSlice';
import { switchProject } from '../store/WorkspaceSlice';
import { setActiveDetailTask } from '../store/TaskSlice';
import { exportWorkspaceJSON } from '../store/Store';
import { Search, FolderKanban, CheckSquare, LayoutGrid, List, Calendar, SunMoon, Download, X } from 'lucide-react';

export default function CommandPalette() {
    const isOpen = useSelector((state) => state.ui.isCommandPaletteOpen);
    const projects = useSelector((state) => state.workspaces.projects);
    const tasks = useSelector((state) => state.tasks.tasks);
    const dispatch = useDispatch();

    const [query, setQuery] = useState('');
    const inputRef = useRef(null);

    // Global shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                dispatch(setCommandPaletteOpen(!isOpen));
            }
            if (e.key === 'Escape' && isOpen) {
                dispatch(setCommandPaletteOpen(false));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, dispatch]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
    const filteredProjects = projects.filter(p => !p.isArchived && p.name.toLowerCase().includes(query.toLowerCase())).slice(0, 3);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-start justify-center z-50 p-4 pt-20">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 dark:border-gray-800 font-sans animate-in fade-in zoom-in-95 duration-150">
                {/* Search Bar */}
                <div className="flex items-center px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                    <Search size={18} className="text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Type a command or search tasks, projects..."
                        className="w-full bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                    />
                    <button
                        onClick={() => dispatch(setCommandPaletteOpen(false))}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Quick Results List */}
                <div className="max-h-80 overflow-y-auto p-2 space-y-3">
                    {/* View Switchers */}
                    <div>
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Navigation & Views
                        </p>
                        <div className="space-y-0.5">
                            <button
                                onClick={() => {
                                    dispatch(setActiveView('kanban'));
                                    dispatch(setCommandPaletteOpen(false));
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <LayoutGrid size={15} className="text-primary" />
                                <span>Switch to Kanban View</span>
                            </button>
                            <button
                                onClick={() => {
                                    dispatch(setActiveView('list'));
                                    dispatch(setCommandPaletteOpen(false));
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <List size={15} className="text-blue-500" />
                                <span>Switch to List / Table View</span>
                            </button>
                            <button
                                onClick={() => {
                                    dispatch(setActiveView('calendar'));
                                    dispatch(setCommandPaletteOpen(false));
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Calendar size={15} className="text-amber-500" />
                                <span>Switch to Calendar View</span>
                            </button>
                        </div>
                    </div>

                    {/* Matching Tasks */}
                    {filteredTasks.length > 0 && (
                        <div>
                            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Tasks
                            </p>
                            <div className="space-y-0.5">
                                {filteredTasks.map(task => (
                                    <button
                                        key={task.id}
                                        onClick={() => {
                                            dispatch(setActiveDetailTask(task.id));
                                            dispatch(setCommandPaletteOpen(false));
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-800 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors text-left"
                                    >
                                        <div className="flex items-center space-x-2.5 truncate">
                                            <CheckSquare size={14} className="text-gray-400 shrink-0" />
                                            <span className="truncate">{task.title}</span>
                                        </div>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase font-semibold shrink-0 ml-2">
                                            {task.priority}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matching Projects */}
                    {filteredProjects.length > 0 && (
                        <div>
                            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Projects
                            </p>
                            <div className="space-y-0.5">
                                {filteredProjects.map(proj => (
                                    <button
                                        key={proj.id}
                                        onClick={() => {
                                            dispatch(switchProject(proj.id));
                                            dispatch(setCommandPaletteOpen(false));
                                        }}
                                        className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-800 dark:text-gray-200 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <FolderKanban size={15} style={{ color: proj.color }} />
                                        <span>{proj.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Utilities */}
                    <div>
                        <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Utilities
                        </p>
                        <div className="space-y-0.5">
                            <button
                                onClick={() => {
                                    dispatch(toggleTheme());
                                    dispatch(setCommandPaletteOpen(false));
                                    dispatch(addToast({ message: 'Theme switched', type: 'info' }));
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <SunMoon size={15} className="text-purple-500" />
                                <span>Toggle Dark / Light Mode</span>
                            </button>
                            <button
                                onClick={() => {
                                    exportWorkspaceJSON();
                                    dispatch(setCommandPaletteOpen(false));
                                    dispatch(addToast({ message: 'Workspace exported as JSON', type: 'success' }));
                                }}
                                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Download size={15} className="text-teal-500" />
                                <span>Export Workspace JSON Backup</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer hint */}
                <div className="px-4 py-2.5 bg-neutral-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px]">Esc</kbd> to close</span>
                    <span>Use <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px]">Ctrl+K</kbd> anytime</span>
                </div>
            </div>
        </div>
    );
}
