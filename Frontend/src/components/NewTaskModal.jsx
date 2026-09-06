import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function NewTaskModal({ isOpen, onClose, onAddTask }) {
    const [title, setTitle] = useState('');
    const [tag, setTag] = useState('Product');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('Sep 10');
    const [columnId, setColumnId] = useState('backlog');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newTask = {
            id: 't-' + Date.now(),
            title,
            tag,
            priority,
            dueDate,
        };

        onAddTask(columnId, newTask);
        setTitle('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Create New Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md">
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Optimize database query performance"
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
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
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
                                className="w-full bg-neutral-100 border border-gray-200 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
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
                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">Tag / Category</label>
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

                    {/* Modal Footer Actions */}
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
                            Create Task
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}