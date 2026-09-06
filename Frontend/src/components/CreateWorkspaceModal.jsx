import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createWorkspace } from '../store/WorkspaceSlice';
import { addToast } from '../store/UiSlice';
import { X, Building2 } from 'lucide-react';

export default function CreateWorkspaceModal({ isOpen, onClose }) {
    const dispatch = useDispatch();

    const [name, setName] = useState('');
    const [color, setColor] = useState('#0D9488');
    const [defaultView, setDefaultView] = useState('kanban');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        dispatch(createWorkspace({
            name: name.trim(),
            color,
            defaultView
        }));

        dispatch(addToast({ message: `Workspace "${name}" created`, type: 'success' }));
        setName('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center space-x-2">
                        <Building2 size={18} className="text-primary" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Create New Workspace</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Workspace Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Acme Corp Workspace"
                            className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                Workspace Color
                            </label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="h-8 w-8 rounded-lg border border-gray-200 cursor-pointer"
                                />
                                <span className="font-mono text-gray-500 text-xs">{color}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                Default View
                            </label>
                            <select
                                value={defaultView}
                                onChange={(e) => setDefaultView(e.target.value)}
                                className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                            >
                                <option value="kanban">Kanban</option>
                                <option value="list">List</option>
                                <option value="calendar">Calendar</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-xl font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                            Create Workspace
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
