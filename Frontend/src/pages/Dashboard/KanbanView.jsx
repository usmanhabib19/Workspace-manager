import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateTask, toggleTaskSelection, setActiveDetailTask, addTask, createTaskRequest } from '../../store/TaskSlice';
import { addToast, addNotification } from '../../store/UiSlice';
import { Plus, Clock, CheckSquare, GripVertical, Paperclip, MessageSquare, ShieldAlert, Lock } from 'lucide-react';

export default function KanbanView() {
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const currentProject = projects.find(p => p.id === activeProjectId);
    const tasks = useSelector((state) => state.tasks.tasks);
    const selectedTaskIds = useSelector((state) => state.tasks.selectedTaskIds);
    const users = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);
    const filters = useSelector((state) => state.ui.filters);
    const searchQuery = useSelector((state) => state.ui.searchQuery);

    const dispatch = useDispatch();
    const [draggedTaskId, setDraggedTaskId] = useState(null);
    const [quickAddColumnId, setQuickAddColumnId] = useState(null);
    const [quickAddTitle, setQuickAddTitle] = useState('');

    const isViewer = currentUser?.role === 'viewer';
    const isMember = currentUser?.role === 'member';

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

    // Apply global search & filter criteria
    const filteredTasks = projectTasks.filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.tag.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.assignee !== 'all' && task.assigneeId !== filters.assignee) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.status !== 'all' && task.columnId !== filters.status) return false;
        if (filters.tag !== 'all' && task.tag !== filters.tag) return false;
        return true;
    });

    const handleDragStart = (e, taskId) => {
        const role = currentUser?.role;
        if (role === 'viewer' || role === 'member') {
            e.preventDefault();
            return false;
        }
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId);
    };

    const handleDragOver = (e) => {
        // Only allow drop if owner or admin
        const role = currentUser?.role;
        if (role === 'viewer' || role === 'member') return;
        e.preventDefault();
    };

    const handleDrop = (e, columnId) => {
        e.preventDefault();
        if (!draggedTaskId) return;

        const role = currentUser?.role;

        if (role === 'viewer' || role === 'member') {
            dispatch(addToast({
                message: 'Permission Denied: Members and Viewers cannot move tasks.',
                type: 'error'
            }));
            setDraggedTaskId(null);
            return;
        }

        const draggedTask = tasks.find(t => t.id === draggedTaskId);
        if (!draggedTask || draggedTask.columnId === columnId) {
            setDraggedTaskId(null);
            return;
        }

        if (role === 'owner') {
            // Owner: move directly
            dispatch(updateTask({
                id: draggedTaskId,
                updates: { columnId },
                actingUserId: currentUser?.id
            }));
            const colObj = currentProject?.columns?.find(c => c.id === columnId);
            dispatch(addToast({
                message: `Task moved to "${colObj?.title || columnId}"`,
                type: 'success',
                canUndo: true
            }));
        } else if (role === 'admin') {
            // Admin: create a move request for Owner approval
            const reqId = 'req-' + Date.now();
            const colObj = currentProject?.columns?.find(c => c.id === columnId);
            const fromColObj = currentProject?.columns?.find(c => c.id === draggedTask.columnId);
            dispatch(createTaskRequest({
                id: reqId,
                type: 'MOVE_TASK',
                data: {
                    taskId: draggedTaskId,
                    taskTitle: draggedTask.title,
                    fromColumnId: draggedTask.columnId,
                    fromColumnTitle: fromColObj?.title || draggedTask.columnId,
                    targetColumnId: columnId,
                    targetColumnTitle: colObj?.title || columnId
                },
                requestedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }
            }));
            dispatch(addNotification({
                title: 'Task Move Request from Admin',
                message: `${currentUser.name} (Admin) wants to move "${draggedTask.title}" from "${fromColObj?.title || draggedTask.columnId}" → "${colObj?.title || columnId}"`,
                type: 'approval',
                requestId: reqId
            }));
            dispatch(addToast({
                message: `Move request sent to Owner for approval.`,
                type: 'info'
            }));
        }

        setDraggedTaskId(null);
    };

    const handleQuickAdd = (e, columnId) => {
        e.preventDefault();
        if (!quickAddTitle.trim()) return;

        if (currentUser?.role === 'owner') {
            dispatch(addTask({
                projectId: activeProjectId,
                columnId,
                title: quickAddTitle.trim(),
                actingUserId: currentUser?.id
            }));
            setQuickAddTitle('');
            setQuickAddColumnId(null);
            dispatch(addToast({ message: 'Task created directly by Owner', type: 'success', canUndo: true }));
        } else if (currentUser?.role === 'admin') {
            const reqId = 'req-' + Date.now();
            const colObj = currentProject?.columns?.find(c => c.id === columnId);
            dispatch(createTaskRequest({
                id: reqId,
                type: 'ADD_TASK',
                data: {
                    projectId: activeProjectId,
                    columnId,
                    title: quickAddTitle.trim()
                },
                requestedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }
            }));
            dispatch(addNotification({
                title: 'Task Add Request from Admin',
                message: `${currentUser.name} (Admin) requested to add task: "${quickAddTitle.trim()}" in ${colObj?.title || columnId}`,
                type: 'approval',
                requestId: reqId
            }));
            setQuickAddTitle('');
            setQuickAddColumnId(null);
            dispatch(addToast({ message: 'Task addition request sent to Owner for approval.', type: 'info' }));
        } else {
            setQuickAddTitle('');
            setQuickAddColumnId(null);
            dispatch(addToast({
                message: 'Permission Denied: Members and Viewers cannot add tasks. Only Owner can add directly or Admin can request.',
                type: 'error'
            }));
        }
    };

    if (!currentProject) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                No active project found. Select or create one from the sidebar.
            </div>
        );
    }

    return (
        <div className="flex space-x-6 flex-1 overflow-x-auto pb-4 h-full font-sans select-none">
            {currentProject.columns?.map(column => {
                const columnTasks = filteredTasks.filter(t => t.columnId === column.id);

                return (
                    <div
                        key={column.id}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, column.id)}
                        className="w-80 shrink-0 flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
                    >
                        {/* Column Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-neutral-50/50 dark:bg-gray-950/40">
                            <div className="flex items-center space-x-2">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${column.color}`}>
                                    {column.title}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    {columnTasks.length}
                                </span>
                            </div>

                            <button
                                onClick={() => {
                                    if (currentUser?.role === 'member' || currentUser?.role === 'viewer') {
                                        dispatch(addToast({
                                            message: 'Permission Denied: Members and Viewers cannot add tasks. Only Owner can add directly or Admin can request.',
                                            type: 'error'
                                        }));
                                        return;
                                    }
                                    setQuickAddColumnId(column.id);
                                }}
                                title={
                                    currentUser?.role === 'owner'
                                        ? 'Add task directly (Owner)'
                                        : currentUser?.role === 'admin'
                                        ? 'Request task addition (Admin)'
                                        : 'Add task (Restricted)'
                                }
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                    currentUser?.role === 'owner'
                                        ? 'text-gray-400 hover:text-primary'
                                        : currentUser?.role === 'admin'
                                        ? 'text-amber-500 hover:text-amber-600'
                                        : 'text-gray-300 dark:text-gray-600 hover:text-gray-400'
                                }`}
                            >
                                <Plus size={15} />
                            </button>
                        </div>

                        {/* Cards Container */}
                        <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-neutral-50/30 dark:bg-gray-950/20 min-h-[150px]">
                            {/* Quick Add Inline Form */}
                            {quickAddColumnId === column.id && (
                                <form onSubmit={(e) => handleQuickAdd(e, column.id)} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-primary dark:border-teal-500 shadow-md space-y-2">
                                    <input
                                        type="text"
                                        autoFocus
                                        value={quickAddTitle}
                                        onChange={(e) => setQuickAddTitle(e.target.value)}
                                        placeholder={currentUser?.role === 'admin' ? 'Enter task title (sends request to Owner)...' : 'What needs to be done?'}
                                        className="w-full text-xs bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none"
                                    />
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-gray-400">
                                            {currentUser?.role === 'admin' ? 'Requires Owner approval' : 'Direct add'}
                                        </span>
                                        <div className="flex space-x-1.5">
                                            <button
                                                type="button"
                                                onClick={() => setQuickAddColumnId(null)}
                                                className="px-2 py-1 text-[11px] text-gray-500 hover:bg-neutral-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className={`px-2.5 py-1 text-white text-[11px] font-semibold rounded cursor-pointer ${
                                                    currentUser?.role === 'admin' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary hover:bg-primary/90'
                                                }`}
                                            >
                                                {currentUser?.role === 'admin' ? 'Request' : 'Add'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {columnTasks.length === 0 && quickAddColumnId !== column.id ? (
                                <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-xs border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                                    Drop task here
                                </div>
                            ) : (
                                columnTasks.map(task => {
                                    const assignee = users.find(u => u.id === task.assigneeId);
                                    const isSelected = selectedTaskIds.includes(task.id);
                                    const subtasksCount = task.subtasks?.length || 0;
                                    const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

                                    const canDrag = currentUser?.role === 'owner' || currentUser?.role === 'admin';
                                    return (
                                        <div
                                            key={task.id}
                                            draggable={canDrag}
                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                            onClick={() => dispatch(setActiveDetailTask(task.id))}
                                            title={canDrag
                                                ? currentUser?.role === 'admin'
                                                    ? 'Drag to move (Admin: requires Owner approval)'
                                                    : 'Drag to move (Owner)'
                                                : 'Move not allowed for Member/Viewer'
                                            }
                                            className={`p-4 rounded-xl border transition-all group relative bg-white dark:bg-gray-800/90 ${
                                                canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                                            } ${
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/20 shadow-md'
                                                    : 'border-gray-200/80 dark:border-gray-700/70 shadow-xs hover:shadow-md hover:border-primary/50'
                                            } ${
                                                currentUser?.role === 'admin' && canDrag
                                                    ? 'hover:border-amber-400/50'
                                                    : ''
                                            }`}
                                        >
                                            {/* Top row: Multi-select Checkbox + Tag + Priority */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-2">
                                                    {/* Bulk selection checkbox */}
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            dispatch(toggleTaskSelection(task.id));
                                                        }}
                                                        className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                                    />
                                                    <span className="text-[10px] font-medium px-2 py-0.5 bg-neutral-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                                        {task.tag}
                                                    </span>
                                                </div>

                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                    task.priority === 'urgent' ? 'text-red-600 bg-red-50 dark:bg-red-950/50' :
                                                    task.priority === 'high' ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/50' :
                                                    'text-gray-500 bg-gray-50 dark:bg-gray-700'
                                                }`}>
                                                    {task.priority}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors mb-3 leading-snug">
                                                {task.title}
                                            </h4>

                                            {/* Subtask progress if any */}
                                            {subtasksCount > 0 && (
                                                <div className="mb-3 flex items-center space-x-2 text-[11px] text-gray-400">
                                                    <CheckSquare size={12} className="text-primary" />
                                                    <span>{completedSubtasks}/{subtasksCount} subtasks</span>
                                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
                                                        <div
                                                            className="bg-primary h-full"
                                                            style={{ width: `${(completedSubtasks / subtasksCount) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Footer Info: Due Date, Attachments, Comments, Assignee */}
                                            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                                                <div className="flex items-center space-x-2.5">
                                                    <div className="flex items-center space-x-1">
                                                        <Clock size={12} />
                                                        <span>{task.dueDate}</span>
                                                    </div>
                                                    {task.attachments?.length > 0 && (
                                                        <div className="flex items-center space-x-0.5">
                                                            <Paperclip size={11} />
                                                            <span>{task.attachments.length}</span>
                                                        </div>
                                                    )}
                                                    {task.comments?.length > 0 && (
                                                        <div className="flex items-center space-x-0.5">
                                                            <MessageSquare size={11} />
                                                            <span>{task.comments.length}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Assignee Avatar */}
                                                <div className="h-6 w-6 rounded-full border border-gray-200 overflow-hidden shrink-0" title={assignee?.name}>
                                                    <img src={assignee?.avatar} alt={assignee?.name} className="h-full w-full object-cover" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Quick Add at bottom */}
                        {!isViewer && (
                            <div className="p-3 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                                <button
                                    onClick={() => setQuickAddColumnId(column.id)}
                                    className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary text-gray-500 hover:text-primary rounded-xl text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                >
                                    <Plus size={14} />
                                    <span>Add task</span>
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
