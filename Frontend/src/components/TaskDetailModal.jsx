import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setActiveDetailTask,
    updateTask,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    convertSubtaskToTask,
    addAttachment,
    removeAttachment,
    addComment,
    deleteComment,
    createTaskRequest
} from '../store/TaskSlice';
import { addToast, addNotification } from '../store/UiSlice';
import {
    X, CheckSquare, Square, Plus, Trash2, Paperclip, MessageSquare,
    Clock, Tag, Flag, Calendar, User, Copy, ArrowUpRight, AlertCircle, Send, ShieldAlert, Lock
} from 'lucide-react';

export default function TaskDetailModal() {
    const taskId = useSelector((state) => state.tasks.activeDetailTaskId);
    const task = useSelector((state) => state.tasks.tasks.find(t => t.id === taskId));
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const currentProject = projects.find(p => p.id === (task?.projectId || activeProjectId));
    const users = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);
    const pendingRequests = useSelector((state) => state.tasks.pendingRequests || []);

    const dispatch = useDispatch();

    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [commentText, setCommentText] = useState('');
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
    const fileInputRef = useRef(null);

    if (!task) return null;

    const isViewer = currentUser?.role === 'viewer';

    const handleFieldChange = (field, value) => {
        if (isViewer) {
            dispatch(addToast({ message: 'Viewers have read-only access.', type: 'error' }));
            return;
        }
        dispatch(updateTask({
            id: task.id,
            updates: { [field]: value },
            actingUserId: currentUser?.id
        }));
    };

    const handleAddSubtask = (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || isViewer) return;
        dispatch(addSubtask({
            taskId: task.id,
            title: newSubtaskTitle.trim(),
            actingUserId: currentUser?.id
        }));
        setNewSubtaskTitle('');
    };

    const handleFileUpload = (e) => {
        if (isViewer) {
            dispatch(addToast({ message: 'Viewers cannot upload attachments.', type: 'error' }));
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvt) => {
            dispatch(addAttachment({
                taskId: task.id,
                file: {
                    name: file.name,
                    size: (file.size / 1024).toFixed(1) + ' KB',
                    type: file.type,
                    dataUrl: loadEvt.target.result
                }
            }));
            dispatch(addToast({ message: `Attached "${file.name}"`, type: 'success' }));
        };
        reader.readAsDataURL(file);
    };

    const handleCommentChange = (e) => {
        const val = e.target.value;
        setCommentText(val);

        // Check if user is typing an @mention
        const lastAt = val.lastIndexOf('@');
        if (lastAt !== -1 && lastAt === val.length - 1) {
            setShowMentionSuggestions(true);
            setMentionQuery('');
        } else if (lastAt !== -1 && val.slice(lastAt).indexOf(' ') === -1) {
            setShowMentionSuggestions(true);
            setMentionQuery(val.slice(lastAt + 1));
        } else {
            setShowMentionSuggestions(false);
        }
    };

    const handleSelectMention = (user) => {
        const lastAt = commentText.lastIndexOf('@');
        const before = commentText.slice(0, lastAt);
        setCommentText(`${before}@${user.name} `);
        setShowMentionSuggestions(false);
    };

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        dispatch(addComment({
            taskId: task.id,
            text: commentText.trim(),
            user: currentUser
        }));
        setCommentText('');
        setShowMentionSuggestions(false);
    };

    const completedSubtasksCount = task.subtasks?.filter(s => s.completed).length || 0;
    const totalSubtasksCount = task.subtasks?.length || 0;
    const progressPercent = totalSubtasksCount > 0 ? Math.round((completedSubtasksCount / totalSubtasksCount) * 100) : 0;

    const isPendingDelete = pendingRequests.some(r => r.status === 'pending' && r.type === 'DELETE_TASK' && r.data?.id === task?.id);

    const handleDeleteTask = () => {
        if (currentUser?.role === 'owner') {
            dispatch(deleteTask({ id: task.id }));
            dispatch(setActiveDetailTask(null));
            dispatch(addToast({ message: 'Task deleted directly by Owner', type: 'info', canUndo: true }));
        } else if (currentUser?.role === 'admin') {
            if (isPendingDelete) {
                dispatch(addToast({ message: 'Deletion request already pending Owner approval.', type: 'info' }));
                return;
            }
            const reqId = 'req-' + Date.now();
            dispatch(createTaskRequest({
                id: reqId,
                type: 'DELETE_TASK',
                data: { id: task.id, title: task.title, projectId: task.projectId },
                requestedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }
            }));
            dispatch(addNotification({
                title: 'Task Delete Request from Admin',
                message: `${currentUser.name} (Admin) requested to delete task: "${task.title}"`,
                type: 'approval',
                requestId: reqId
            }));
            dispatch(addToast({ message: 'Task deletion request sent to Owner for approval.', type: 'info' }));
        } else {
            dispatch(addToast({
                message: 'Permission Denied: Members and Viewers cannot delete tasks. Only Owner can delete directly.',
                type: 'error'
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 font-sans animate-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center space-x-2.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-950 text-primary border border-teal-200 dark:border-teal-800">
                            {currentProject?.name || 'Sprint Board'}
                        </span>
                        <span className="text-xs text-gray-400">/</span>
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                            {task.columnId}
                        </span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {/* Duplicate Button */}
                        <button
                            onClick={() => {
                                if (isViewer) return;
                                dispatch(duplicateTask(task.id));
                                dispatch(addToast({ message: 'Task duplicated', type: 'success' }));
                            }}
                            title="Duplicate task"
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <Copy size={16} />
                        </button>

                        {/* Delete Button with Role-Based Behavior */}
                        <button
                            onClick={handleDeleteTask}
                            title={
                                currentUser?.role === 'owner'
                                    ? 'Delete task (Owner direct action)'
                                    : currentUser?.role === 'admin'
                                    ? 'Request task deletion (Sent to Owner for approval)'
                                    : 'Delete task (Members & Viewers restricted)'
                            }
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                currentUser?.role === 'owner'
                                    ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950'
                                    : currentUser?.role === 'admin'
                                    ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950'
                                    : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <Trash2 size={16} />
                        </button>

                        <button
                            onClick={() => dispatch(setActiveDetailTask(null))}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Pending Deletion Warning Banner */}
                {isPendingDelete && (
                    <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60 flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-medium">
                        <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                        <span>A deletion request for this task was submitted by Admin and is currently pending approval by Owner.</span>
                    </div>
                )}

                {/* Read Only Banner for Viewer Role */}
                {isViewer && (
                    <div className="px-6 py-2 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800/50 flex items-center space-x-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
                        <AlertCircle size={14} />
                        <span>You are logged in as a <strong>Viewer</strong>. Tasks and subtasks are in read-only mode.</span>
                    </div>
                )}

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Title */}
                    <div>
                        <input
                            type="text"
                            value={task.title}
                            disabled={isViewer}
                            onChange={(e) => handleFieldChange('title', e.target.value)}
                            placeholder="Task title..."
                            className="w-full text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-0 focus:outline-none focus:ring-0 p-0 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Metadata Properties Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 text-xs">
                        {/* Status Column */}
                        <div>
                            <span className="text-gray-400 flex items-center space-x-1 mb-1">
                                <Flag size={13} />
                                <span>Status</span>
                            </span>
                            <select
                                value={task.columnId}
                                disabled={isViewer}
                                onChange={(e) => handleFieldChange('columnId', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                            >
                                {currentProject?.columns?.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Priority */}
                        <div>
                            <span className="text-gray-400 flex items-center space-x-1 mb-1">
                                <Flag size={13} />
                                <span>Priority</span>
                            </span>
                            <select
                                value={task.priority}
                                disabled={isViewer}
                                onChange={(e) => handleFieldChange('priority', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>

                        {/* Assignee */}
                        <div>
                            <span className="text-gray-400 flex items-center space-x-1 mb-1">
                                <User size={13} />
                                <span>Assignee</span>
                            </span>
                            <select
                                value={task.assigneeId || 'u-1'}
                                disabled={isViewer}
                                onChange={(e) => handleFieldChange('assigneeId', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                            >
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Due Date */}
                        <div>
                            <span className="text-gray-400 flex items-center space-x-1 mb-1">
                                <Calendar size={13} />
                                <span>Due Date</span>
                            </span>
                            <input
                                type="date"
                                value={task.dueDate}
                                disabled={isViewer}
                                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={task.description}
                            disabled={isViewer}
                            onChange={(e) => handleFieldChange('description', e.target.value)}
                            placeholder="Add more details or notes about this task..."
                            className="w-full p-3 bg-neutral-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                    </div>

                    {/* Nested Subtasks Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
                                <span>Subtasks</span>
                                {totalSubtasksCount > 0 && (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-primary border border-teal-200 dark:border-teal-800">
                                        {completedSubtasksCount}/{totalSubtasksCount} ({progressPercent}%)
                                    </span>
                                )}
                            </label>
                        </div>

                        {/* Progress Bar */}
                        {totalSubtasksCount > 0 && (
                            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        )}

                        {/* Subtasks List */}
                        <div className="space-y-1.5">
                            {task.subtasks?.map(subtask => (
                                <div
                                    key={subtask.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-800/60 group text-xs transition-colors"
                                >
                                    <button
                                        type="button"
                                        disabled={isViewer}
                                        onClick={() => dispatch(toggleSubtask({ taskId: task.id, subtaskId: subtask.id }))}
                                        className="flex items-center space-x-2.5 text-left flex-1 cursor-pointer"
                                    >
                                        {subtask.completed ? (
                                            <CheckSquare size={16} className="text-primary shrink-0" />
                                        ) : (
                                            <Square size={16} className="text-gray-400 shrink-0" />
                                        )}
                                        <span className={`text-gray-800 dark:text-gray-200 ${subtask.completed ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                            {subtask.title}
                                        </span>
                                    </button>

                                    {!isViewer && (
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {/* Convert to full task */}
                                            <button
                                                onClick={() => {
                                                    dispatch(convertSubtaskToTask({ taskId: task.id, subtaskId: subtask.id }));
                                                    dispatch(addToast({ message: 'Subtask converted to full task', type: 'success' }));
                                                }}
                                                title="Convert to full task"
                                                className="p-1 text-gray-400 hover:text-primary rounded"
                                            >
                                                <ArrowUpRight size={13} />
                                            </button>
                                            {/* Delete subtask */}
                                            <button
                                                onClick={() => dispatch(deleteSubtask({ taskId: task.id, subtaskId: subtask.id }))}
                                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add Subtask Form */}
                        {!isViewer && (
                            <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 pt-1">
                                <input
                                    type="text"
                                    value={newSubtaskTitle}
                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    placeholder="Add a checklist item (subtask)..."
                                    className="flex-1 bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                                >
                                    <Plus size={13} />
                                    <span>Add</span>
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Attachments Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                                <Paperclip size={13} />
                                <span>Attachments ({task.attachments?.length || 0})</span>
                            </label>

                            {!isViewer && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                                >
                                    + Attach File
                                </button>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {task.attachments?.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {task.attachments.map(att => (
                                    <div
                                        key={att.id}
                                        className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-800/40 text-xs"
                                    >
                                        <div className="flex items-center space-x-2 truncate">
                                            <Paperclip size={13} className="text-primary shrink-0" />
                                            <div className="truncate">
                                                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{att.name}</p>
                                                <p className="text-[10px] text-gray-400">{att.size}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-1">
                                            <a
                                                href={att.dataUrl}
                                                download={att.name}
                                                className="p-1 text-gray-400 hover:text-primary rounded text-xs"
                                                title="Download"
                                            >
                                                Download
                                            </a>
                                            {!isViewer && (
                                                <button
                                                    onClick={() => dispatch(removeAttachment({ taskId: task.id, attachmentId: att.id }))}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">No files attached yet.</p>
                        )}
                    </div>

                    {/* Comments & Discussion */}
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <MessageSquare size={13} />
                            <span>Comments & Discussions</span>
                        </label>

                        {/* Comment Thread */}
                        <div className="space-y-3">
                            {task.comments?.map(comment => (
                                <div key={comment.id} className="flex space-x-3 text-xs">
                                    <img
                                        src={comment.avatar}
                                        alt={comment.userName}
                                        className="h-7 w-7 rounded-full bg-teal-100 border border-gray-200 shrink-0"
                                    />
                                    <div className="flex-1 bg-neutral-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.userName}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {comment.userId === currentUser?.id && (
                                                    <button
                                                        onClick={() => dispatch(deleteComment({ taskId: task.id, commentId: comment.id }))}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Comment Input with @Mention Autocomplete */}
                        <div className="relative">
                            <form onSubmit={handleAddComment} className="flex space-x-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={handleCommentChange}
                                    placeholder="Write a comment... (Type @ to mention teammates)"
                                    className="flex-1 bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-medium text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
                                >
                                    <Send size={13} />
                                    <span>Send</span>
                                </button>
                            </form>

                            {/* @Mention Autocomplete Popup */}
                            {showMentionSuggestions && (
                                <div className="absolute bottom-full mb-1 left-0 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-20 py-1">
                                    <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        Mention Member
                                    </p>
                                    {users
                                        .filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                                        .map(u => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => handleSelectMention(u)}
                                                className="w-full flex items-center space-x-2 px-3 py-1.5 hover:bg-neutral-100 dark:hover:bg-gray-800 text-left text-xs transition-colors"
                                            >
                                                <img src={u.avatar} alt={u.name} className="h-5 w-5 rounded-full" />
                                                <span className="text-gray-800 dark:text-gray-200 font-medium">{u.name}</span>
                                                <span className="text-[10px] text-gray-400 capitalize">({u.role})</span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <Clock size={13} />
                            <span>Activity History</span>
                        </label>
                        <div className="space-y-1.5">
                            {task.activity?.map(act => (
                                <div key={act.id} className="flex items-center justify-between text-[11px] text-gray-500 py-1">
                                    <span>
                                        <strong>{users.find(u => u.id === act.userId)?.name || 'User'}</strong> {act.text}
                                    </span>
                                    <span className="text-gray-400">{act.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
