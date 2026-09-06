import React, { useState, useEffect } from 'react';
import { MoreHorizontal, Plus, Clock, Trash2, GripVertical } from 'lucide-react';
import TaskModal from '../../components/TaskModal';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/tasks`;

export default function KanbanBoard() {
    const [columns, setColumns] = useState([
        { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700', tasks: [] },
        { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 text-blue-700', tasks: [] },
        { id: 'review', title: 'In Review / QA', color: 'bg-amber-50 text-amber-700', tasks: [] },
        { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-700', tasks: [] }
    ]);

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedColumnId, setSelectedColumnId] = useState('backlog');
    const [currentTask, setCurrentTask] = useState(null);
    const [draggedTaskId, setDraggedTaskId] = useState(null);

    // Fetch tasks from backend on mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(API_BASE_URL);
            const allTasks = response.data;

            // Map backend tasks (_id mapped to id, columnId mapped to columns)
            setColumns(prevColumns =>
                prevColumns.map(col => ({
                    ...col,
                    tasks: allTasks
                        .filter(t => t.columnId === col.id)
                        .map(t => ({ ...t, id: t._id }))
                }))
            );
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const handleOpenCreateModal = (columnId = 'backlog') => {
        setModalMode('create');
        setSelectedColumnId(columnId);
        setCurrentTask(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (columnId, task) => {
        setModalMode('edit');
        setSelectedColumnId(columnId);
        setCurrentTask(task);
        setIsModalOpen(true);
    };

    const handleSaveTask = async (taskData, targetColumnId) => {
        try {
            if (modalMode === 'create') {
                const response = await axios.post(API_BASE_URL, {
                    ...taskData,
                    columnId: targetColumnId
                });
                const newTask = { ...response.data, id: response.data._id };

                setColumns(prev => prev.map(col =>
                    col.id === targetColumnId ? { ...col, tasks: [newTask, ...col.tasks] } : col
                ));
            } else {
                const response = await axios.put(`${API_BASE_URL}/${currentTask.id}`, {
                    ...taskData,
                    columnId: targetColumnId
                });
                const updatedTask = { ...response.data, id: response.data._id };

                // Reorganize across columns
                fetchTasks();
            }
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete(`${API_BASE_URL}/${taskId}`);
            setColumns(prev => prev.map(col => ({
                ...col,
                tasks: col.tasks.filter(t => t.id !== taskId)
            })));
        } catch (error) {
            console.error("Error deleting task:", error);
        }
    };

    const handleDragStart = (e, taskId) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetColumnId) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        try {
            // Update backend status/column
            await axios.put(`${API_BASE_URL}/${draggedTaskId}`, {
                columnId: targetColumnId
            });

            fetchTasks();
        } catch (error) {
            console.error("Error updating task column on drop:", error);
        }

        setDraggedTaskId(null);
    };

    return (
        <div className="flex flex-col h-full font-sans">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-1 gap-3">
                <div className="relative w-full sm:w-72">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search tasks, tags..."
                        className="w-full bg-white border border-gray-200 text-xs rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 shadow-xs"
                    />
                </div>

                <button
                    onClick={() => handleOpenCreateModal('backlog')}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-xs font-medium flex items-center space-x-1 transition-colors shadow-sm shrink-0"
                >
                    <Plus size={14} />
                    <span>New Task</span>
                </button>
            </div>

            <div className="flex space-x-6 flex-1 overflow-x-auto pb-4">
                {columns.map((column) => {
                    const filteredTasks = column.tasks.filter(task =>
                        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        task.tag.toLowerCase().includes(searchQuery.toLowerCase())
                    );

                    return (
                        <div
                            key={column.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, column.id)}
                            className="w-80 flex-shrink-0 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                        >
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="flex items-center space-x-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${column.color}`}>
                                        {column.title}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">{filteredTasks.length}</span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600 p-1 rounded">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-neutral-50/50 min-h-[200px]">
                                {filteredTasks.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 text-xs border-2 border-dashed border-gray-200 rounded-lg">
                                        Drop tasks here or add new
                                    </div>
                                ) : (
                                    filteredTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onClick={() => handleOpenEditModal(column.id, task)}
                                            className="bg-white p-4 rounded-lg border border-gray-200/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all cursor-grab active:cursor-grabbing group relative"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-1.5">
                                                    <span className="text-gray-300 group-hover:text-gray-500">
                                                        <GripVertical size={14} />
                                                    </span>
                                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                                        {task.tag}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'text-red-600 bg-red-50' :
                                                        task.priority === 'high' ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors mb-3">
                                                {task.title}
                                            </h4>

                                            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                                <div className="flex items-center space-x-1">
                                                    <Clock size={12} />
                                                    <span>{task.dueDate}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteTask(task.id);
                                                        }}
                                                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                                                        title="Delete Task"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-700">
                                                        MU
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-3 border-t border-gray-100 bg-white">
                                <button
                                    onClick={() => handleOpenCreateModal(column.id)}
                                    className="w-full py-2 border border-dashed border-gray-300 hover:border-primary text-gray-500 hover:text-primary rounded-lg text-xs font-medium flex items-center justify-center space-x-1 transition-colors"
                                >
                                    <Plus size={14} />
                                    <span>Add task</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                mode={modalMode}
                initialData={currentTask}
                defaultColumnId={selectedColumnId}
            />
        </div>
    );
}