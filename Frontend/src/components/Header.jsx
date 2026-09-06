import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    setActiveView,
    setFilter,
    resetFilters,
    applyPreset,
    setCommandPaletteOpen,
    toggleTheme,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationPreference,
    triggerFakeSync,
    finishFakeSync,
    addToast,
    addNotification
} from '../store/UiSlice';
import { addTask, createTaskRequest, approveTaskRequest, rejectTaskRequest } from '../store/TaskSlice';
import {
    LayoutGrid, List, Calendar, Search, Filter, Bell, Sun, Moon,
    Plus, CheckCircle2, Wifi, WifiOff, RefreshCw, X, ShieldAlert, Check, CheckCheck, Clock, Lock
} from 'lucide-react';

export default function Header() {
    const activeView = useSelector((state) => state.ui.activeView);
    const theme = useSelector((state) => state.ui.theme);
    const isOnline = useSelector((state) => state.ui.isOnline);
    const isSyncing = useSelector((state) => state.ui.isSyncing);
    const filters = useSelector((state) => state.ui.filters);
    const savedPresets = useSelector((state) => state.ui.savedPresets);
    const notifications = useSelector((state) => state.ui.notifications);
    const notificationPreferences = useSelector((state) => state.ui.notificationPreferences);
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const currentProject = projects.find(p => p.id === activeProjectId);
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const activeWorkspaceId = useSelector((state) => state.workspaces.activeWorkspaceId);
    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const currentUser = useSelector((state) => state.auth.currentUser);

    const dispatch = useDispatch();

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isAdminAddModalOpen, setIsAdminAddModalOpen] = useState(false);
    const [adminTaskForm, setAdminTaskForm] = useState({
        title: '',
        columnId: 'backlog',
        priority: 'medium',
        description: ''
    });

    const pendingRequests = useSelector((state) => state.tasks.pendingRequests || []);
    const unhandledRequests = pendingRequests.filter(r => r.status === 'pending');
    const unreadCount = notifications.filter(n => !n.isRead).length + (currentUser?.role === 'owner' ? unhandledRequests.length : 0);

    const handleTaskAddAction = () => {
        if (!activeProjectId) return;

        if (currentUser?.role === 'owner') {
            dispatch(addTask({
                projectId: activeProjectId,
                title: 'New Task',
                actingUserId: currentUser?.id
            }));
            dispatch(addToast({ message: 'Task created directly by Owner', type: 'success', canUndo: true }));
        } else if (currentUser?.role === 'admin') {
            setIsAdminAddModalOpen(true);
        } else {
            dispatch(addToast({
                message: 'Permission Denied: Members and Viewers cannot add tasks. Only Owner can add directly or Admin can request.',
                type: 'error'
            }));
        }
    };

    const handleAdminSubmitRequest = (e) => {
        e.preventDefault();
        if (!adminTaskForm.title.trim()) return;

        const reqId = 'req-' + Date.now();
        dispatch(createTaskRequest({
            id: reqId,
            type: 'ADD_TASK',
            data: {
                projectId: activeProjectId,
                title: adminTaskForm.title.trim(),
                columnId: adminTaskForm.columnId,
                priority: adminTaskForm.priority,
                description: adminTaskForm.description.trim()
            },
            requestedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }
        }));

        dispatch(addNotification({
            title: 'Task Add Request from Admin',
            message: `${currentUser.name} (Admin) requested to add task: "${adminTaskForm.title.trim()}"`,
            type: 'approval',
            requestId: reqId
        }));

        dispatch(addToast({
            message: 'Task addition request sent to Owner for approval.',
            type: 'info'
        }));

        setAdminTaskForm({ title: '', columnId: 'backlog', priority: 'medium', description: '' });
        setIsAdminAddModalOpen(false);
    };

    const handleApprove = (req) => {
        dispatch(approveTaskRequest({ requestId: req.id }));
        const actionText = req.type === 'ADD_TASK'
            ? 'Task created'
            : req.type === 'MOVE_TASK'
            ? `Task moved to "${req.data?.targetColumnTitle}"`
            : req.type === 'BULK_DELETE_TASK'
            ? 'Tasks deleted'
            : 'Task deleted';
        dispatch(addToast({ message: `Approved: ${actionText}`, type: 'success' }));
        const actionVerb = req.type === 'ADD_TASK' ? 'add' : req.type === 'MOVE_TASK' ? 'move' : 'delete';
        const actionTarget = req.type === 'MOVE_TASK'
            ? `"${req.data?.taskTitle}" to ${req.data?.targetColumnTitle}`
            : `"${req.data?.title || 'task'}"`;
        dispatch(addNotification({
            title: 'Request Approved by Owner',
            message: `Owner approved your request to ${actionVerb} ${actionTarget}.`,
            type: 'assigned'
        }));
    };

    const handleReject = (req) => {
        dispatch(rejectTaskRequest({ requestId: req.id }));
        dispatch(addToast({ message: 'Request rejected', type: 'info' }));
        const actionVerb = req.type === 'ADD_TASK' ? 'add' : req.type === 'MOVE_TASK' ? 'move' : 'delete';
        const actionTarget = req.type === 'MOVE_TASK'
            ? `"${req.data?.taskTitle}" to ${req.data?.targetColumnTitle}`
            : `"${req.data?.title || 'task'}"`;
        dispatch(addNotification({
            title: 'Request Declined by Owner',
            message: `Owner declined your request to ${actionVerb} ${actionTarget}.`,
            type: 'assigned'
        }));
    };

    // Simulated online/offline listeners
    useEffect(() => {
        const handleOnline = () => dispatch(setFilter({ isOnline: true }));
        const handleOffline = () => dispatch(setFilter({ isOnline: false }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [dispatch]);

    // Keyboard shortcut 'c' for new task, '1', '2', '3' for views
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['input', 'textarea'].includes(e.target.tagName?.toLowerCase())) return;

            if (e.key === 'c' || e.key === 'C') {
                e.preventDefault();
                handleTaskAddAction();
            } else if (e.key === '1') {
                dispatch(setActiveView('kanban'));
            } else if (e.key === '2') {
                dispatch(setActiveView('list'));
            } else if (e.key === '3') {
                dispatch(setActiveView('calendar'));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [dispatch, activeProjectId, currentUser]);

    const handleManualSync = () => {
        dispatch(triggerFakeSync());
        setTimeout(() => {
            dispatch(finishFakeSync());
            dispatch(addToast({ message: 'Offline changes reconciled and synchronized', type: 'success' }));
        }, 1200);
    };

    return (
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between shrink-0 font-sans z-20">
            
            {/* Left: Breadcrumbs & Project Title */}
            <div className="flex items-center space-x-3 min-w-0">
                <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {currentProject?.name || 'Workspace'}
                </h1>
                <span className="text-[10px] bg-teal-50 dark:bg-teal-950 text-primary border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-full font-medium shrink-0">
                    {currentWorkspace?.name || 'Kinetic'}
                </span>

                {/* View Switcher Buttons */}
                <div className="hidden sm:flex items-center space-x-0.5 bg-neutral-100 dark:bg-gray-800 p-1 rounded-xl text-xs ml-2">
                    <button
                        onClick={() => dispatch(setActiveView('kanban'))}
                        className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                            activeView === 'kanban'
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-xs font-semibold'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Kanban View (Shortcut: 1)"
                    >
                        <LayoutGrid size={13} />
                        <span>Board</span>
                    </button>

                    <button
                        onClick={() => dispatch(setActiveView('list'))}
                        className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                            activeView === 'list'
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-xs font-semibold'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="List View (Shortcut: 2)"
                    >
                        <List size={13} />
                        <span>List</span>
                    </button>

                    <button
                        onClick={() => dispatch(setActiveView('calendar'))}
                        className={`px-2.5 py-1 rounded-lg flex items-center space-x-1.5 font-medium transition-all ${
                            activeView === 'calendar'
                                ? 'bg-white dark:bg-gray-700 text-primary shadow-xs font-semibold'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        title="Calendar View (Shortcut: 3)"
                    >
                        <Calendar size={13} />
                        <span>Calendar</span>
                    </button>
                </div>
            </div>

            {/* Right: Actions, Search, Notifications, Theme, New Task */}
            <div className="flex items-center space-x-3">
                
                {/* Search / Command Palette Trigger */}
                <button
                    onClick={() => dispatch(setCommandPaletteOpen(true))}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-neutral-100 dark:bg-gray-800 hover:bg-neutral-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 transition-colors"
                >
                    <Search size={13} />
                    <span className="hidden md:inline">Quick search...</span>
                    <kbd className="hidden lg:inline text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-400">
                        Ctrl+K
                    </kbd>
                </button>

                {/* Filter Popover Trigger */}
                <div className="relative">
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2 rounded-xl border text-xs transition-colors flex items-center space-x-1 ${
                            filters.priority !== 'all' || filters.assignee !== 'all' || filters.status !== 'all'
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'bg-neutral-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                        title="Filter Tasks"
                    >
                        <Filter size={14} />
                    </button>

                    {/* Filter Dropdown */}
                    {isFilterOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-4 z-30 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-100">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                <span className="font-bold text-gray-900 dark:text-gray-100">Filter Tasks</span>
                                <button
                                    onClick={() => dispatch(resetFilters())}
                                    className="text-[11px] text-primary hover:underline font-medium"
                                >
                                    Reset
                                </button>
                            </div>

                            {/* Saved Presets */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Filter Presets
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                    {savedPresets.map(preset => (
                                        <button
                                            key={preset.id}
                                            onClick={() => dispatch(applyPreset(preset.id))}
                                            className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-gray-700 dark:text-gray-300 text-[11px] font-medium transition-colors"
                                        >
                                            {preset.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Priority
                                </label>
                                <select
                                    value={filters.priority}
                                    onChange={(e) => dispatch(setFilter({ priority: e.target.value }))}
                                    className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Offline & Sync Indicator */}
                <button
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs transition-colors bg-neutral-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    title={isOnline ? 'Online (Click to force sync)' : 'Offline mode'}
                >
                    {isSyncing ? (
                        <RefreshCw size={13} className="text-primary animate-spin" />
                    ) : isOnline ? (
                        <Wifi size={13} className="text-emerald-500" />
                    ) : (
                        <WifiOff size={13} className="text-amber-500" />
                    )}
                    <span className="hidden xl:inline text-[11px] font-medium">
                        {isSyncing ? 'Syncing...' : isOnline ? 'Online' : 'Offline'}
                    </span>
                </button>

                {/* Notification Bell */}
                {/* Owner Pending Approvals Alert Badge */}
                {currentUser?.role === 'owner' && unhandledRequests.length > 0 && (
                    <button
                        onClick={() => setIsNotifOpen(true)}
                        className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all animate-pulse cursor-pointer"
                        title="Pending requests requiring Owner approval"
                    >
                        <ShieldAlert size={13} />
                        <span>{unhandledRequests.length} Approval{unhandledRequests.length > 1 ? 's' : ''}</span>
                    </button>
                )}

                {/* Notification Bell */}
                <div className="relative">
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-neutral-100 dark:bg-gray-800 hover:bg-neutral-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors relative cursor-pointer"
                        title="Notifications & Approvals"
                    >
                        <Bell size={14} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 top-full mt-2 w-84 sm:w-96 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden z-30 font-sans text-xs animate-in fade-in zoom-in-95 duration-100">
                            <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-neutral-50/50 dark:bg-gray-950/40">
                                <span className="font-bold text-gray-900 dark:text-gray-100">Notifications & Approvals</span>
                                <button
                                    onClick={() => dispatch(markAllNotificationsRead())}
                                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                                >
                                    Mark all read
                                </button>
                            </div>

                            {/* Pending Approvals Section */}
                            {unhandledRequests.length > 0 && (
                                <div className="bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/60 p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                                            <ShieldAlert size={13} className="text-amber-600 dark:text-amber-400" />
                                            <span>Pending Approvals ({unhandledRequests.length})</span>
                                        </span>
                                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                            {currentUser?.role === 'owner' ? 'Owner Action Required' : 'Awaiting Owner Approval'}
                                        </span>
                                    </div>

                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5">
                                        {unhandledRequests.map(req => (
                                            <div
                                                key={req.id}
                                                className="bg-white dark:bg-gray-900 rounded-xl p-2.5 border border-amber-200/80 dark:border-amber-800/50 shadow-xs space-y-1.5 text-xs"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                                                        req.type === 'ADD_TASK'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : req.type === 'MOVE_TASK'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                                    }`}>
                                                        {req.type === 'ADD_TASK' ? 'Add Task' : req.type === 'MOVE_TASK' ? 'Move Task' : req.type === 'BULK_DELETE_TASK' ? 'Bulk Delete' : 'Delete Task'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        by {req.requestedBy?.name} ({req.requestedBy?.role})
                                                    </span>
                                                </div>

                                                <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200">
                                                    {req.type === 'ADD_TASK'
                                                        ? `Create task "${req.data?.title}" in ${req.data?.columnId || 'backlog'}`
                                                        : req.type === 'MOVE_TASK'
                                                        ? `Move "${req.data?.taskTitle}" from "${req.data?.fromColumnTitle}" → "${req.data?.targetColumnTitle}"`
                                                        : req.type === 'BULK_DELETE_TASK'
                                                        ? `Delete ${req.data?.ids?.length || 'multiple'} selected tasks`
                                                        : `Delete task "${req.data?.title || 'Selected task'}"`}
                                                </p>

                                                {currentUser?.role === 'owner' ? (
                                                    <div className="flex items-center space-x-2 pt-1">
                                                        <button
                                                            onClick={() => handleApprove(req)}
                                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold py-1 px-2 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                                        >
                                                            <Check size={12} />
                                                            <span>Accept</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(req)}
                                                            className="flex-1 bg-neutral-100 dark:bg-gray-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950 dark:hover:text-rose-300 text-gray-600 dark:text-gray-300 text-[11px] font-semibold py-1 px-2 rounded-lg flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                                                        >
                                                            <X size={12} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-amber-600 dark:text-amber-400 italic">
                                                        Waiting for Muhammad Usman (Owner) to accept.
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Notifications list */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400 text-xs">No notifications yet.</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => dispatch(markNotificationRead(n.id))}
                                            className={`p-3 hover:bg-neutral-50 dark:hover:bg-gray-800/60 cursor-pointer transition-colors ${
                                                !n.isRead ? 'bg-teal-50/30 dark:bg-teal-950/20' : ''
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{n.title}</span>
                                                <span className="text-[10px] text-gray-400">{n.time}</span>
                                            </div>
                                            <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                                                {n.message}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Preferences toggles */}
                            <div className="p-3 bg-neutral-50/60 dark:bg-gray-950/60 border-t border-gray-100 dark:border-gray-800 space-y-1.5 text-[11px]">
                                <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Preferences</span>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Task Assigned</span>
                                    <input
                                        type="checkbox"
                                        checked={notificationPreferences.assigned}
                                        onChange={() => dispatch(toggleNotificationPreference('assigned'))}
                                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">Comment Mentions</span>
                                    <input
                                        type="checkbox"
                                        checked={notificationPreferences.mention}
                                        onChange={() => dispatch(toggleNotificationPreference('mention'))}
                                        className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Dark / Light Theme Toggle */}
                <button
                    onClick={() => {
                        dispatch(toggleTheme());
                        dispatch(addToast({ message: `Switched to ${theme === 'light' ? 'Dark' : 'Light'} mode`, type: 'info' }));
                    }}
                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-neutral-100 dark:bg-gray-800 hover:bg-neutral-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-pointer"
                    title="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
                </button>

                {/* New Task / Request Task Button */}
                <button
                    onClick={handleTaskAddAction}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm hover:shadow cursor-pointer shrink-0 ${
                        currentUser?.role === 'owner'
                            ? 'bg-primary hover:bg-primary/90 text-white'
                            : currentUser?.role === 'admin'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-neutral-100 dark:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }`}
                    title={
                        currentUser?.role === 'owner'
                            ? 'Create Task Directly (Owner - Shortcut: C)'
                            : currentUser?.role === 'admin'
                            ? 'Request Task to Owner (Admin - Shortcut: C)'
                            : 'Add Task (Members & Viewers restricted)'
                    }
                >
                    {currentUser?.role === 'owner' ? (
                        <Plus size={14} />
                    ) : currentUser?.role === 'admin' ? (
                        <Clock size={13} />
                    ) : (
                        <Lock size={12} />
                    )}
                    <span className="hidden sm:inline">
                        {currentUser?.role === 'owner'
                            ? 'New Task'
                            : currentUser?.role === 'admin'
                            ? 'Request Task'
                            : 'New Task'}
                    </span>
                </button>

            </div>

            {/* Admin Task Request Modal */}
            {isAdminAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 p-6 space-y-4 font-sans animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                                    <ShieldAlert size={16} className="text-amber-500" />
                                    <span>Admin Request: Add Task</span>
                                </h2>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    Submitted tasks require approval from Muhammad Usman (Owner).
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAdminAddModalOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleAdminSubmitRequest} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={adminTaskForm.title}
                                    onChange={(e) => setAdminTaskForm({ ...adminTaskForm, title: e.target.value })}
                                    placeholder="e.g. Design user onboard walkthrough..."
                                    className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Target Column
                                    </label>
                                    <select
                                        value={adminTaskForm.columnId}
                                        onChange={(e) => setAdminTaskForm({ ...adminTaskForm, columnId: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                                    >
                                        {currentProject?.columns?.map(col => (
                                            <option key={col.id} value={col.id}>{col.title}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={adminTaskForm.priority}
                                        onChange={(e) => setAdminTaskForm({ ...adminTaskForm, priority: e.target.value })}
                                        className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={adminTaskForm.description}
                                    onChange={(e) => setAdminTaskForm({ ...adminTaskForm, description: e.target.value })}
                                    placeholder="Add context or notes for the Owner..."
                                    className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setIsAdminAddModalOpen(false)}
                                    className="px-3.5 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-colors flex items-center space-x-1.5"
                                >
                                    <ShieldAlert size={14} />
                                    <span>Send Request to Owner</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </header>
    );
}
