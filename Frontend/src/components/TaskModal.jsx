import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, mode, initialData, defaultColumnId }) {
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('Product');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('Sep 12');
    const [columnId, setColumnId] = useState(defaultColumnId);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setTitle(initialData.title || '');
            setTag(initialData.tag || 'Product');
            setPriority(initialData.priority || 'medium');
            setDueDate(initialData.dueDate || 'Sep 12');
            setColumnId(defaultColumnId);
        } else {
            setTitle('');
            setTag('Product');
            setPriority('medium');
            setDueDate('Sep 12');
            setColumnId(defaultColumnId);
        }
    }, [isOpen, mode, initialData, defaultColumnId]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onSave({ title, tag, priority, dueDate }, columnId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 font-sans">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 text-sm">
                        {mode === 'create' ? 'Create New Task' : 'Edit Task Details'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Fix navbar responsiveness"
                            className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Target Column</label>
                            <select
                                value={columnId}
                                onChange={(e) => setColumnId(e.target.value)}
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 text-xs"
                            >
                                <option value="backlog">Backlog</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">In Review / QA</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 text-xs"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Tag</label>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Due Date</label>
                            <input
                                type="text"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm"
                        >
                            {mode === 'create' ? 'Create Task' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}