import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createProject } from '../store/WorkspaceSlice';
import { addToast } from '../store/UiSlice';
import { X, FolderPlus, Sparkles } from 'lucide-react';

export default function CreateProjectModal({ isOpen, onClose }) {
    const activeWorkspaceId = useSelector((state) => state.workspaces.activeWorkspaceId);
    const dispatch = useDispatch();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#0D9488');
    const [template, setTemplate] = useState('sprint'); // 'sprint', 'bug-tracker', 'product-roadmap'

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        dispatch(createProject({
            workspaceId: activeWorkspaceId,
            name: name.trim(),
            description: description.trim(),
            color,
            template
        }));

        dispatch(addToast({ message: `Project "${name}" created with template`, type: 'success' }));
        setName('');
        setDescription('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col animate-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center space-x-2">
                        <FolderPlus size={18} className="text-primary" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Create New Project</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Mobile App Launch"
                            className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={2}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional project summary or goal..."
                            className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />
                    </div>

                    {/* Predefined Templates */}
                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                            <Sparkles size={13} className="text-primary" />
                            <span>Select Template</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setTemplate('sprint')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                    template === 'sprint'
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <p className="font-semibold text-[11px]">Sprint Scrum</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Backlog, In Progress, Review, Done</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTemplate('bug-tracker')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                    template === 'bug-tracker'
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <p className="font-semibold text-[11px]">Bug Tracker</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Reported, Triaged, Fixing, Resolved</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setTemplate('product-roadmap')}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                    template === 'product-roadmap'
                                        ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/30'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <p className="font-semibold text-[11px]">Roadmap</p>
                                <p className="text-[9px] text-gray-400 mt-0.5">Q1 Now, Q2 Next, Future</p>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                            Color Tag
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
                            Create Project
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}
