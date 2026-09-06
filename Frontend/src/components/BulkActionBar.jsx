import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearSelectedTasks, bulkUpdateStatus, bulkUpdateAssignee, bulkDeleteTasks, createTaskRequest } from '../store/TaskSlice';
import { addToast, addNotification } from '../store/UiSlice';
import { CheckSquare, Trash2, User, Flag, X, ShieldAlert } from 'lucide-react';

export default function BulkActionBar() {
    const selectedIds = useSelector((state) => state.tasks.selectedTaskIds);
    const users = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const currentProject = projects.find(p => p.id === activeProjectId);

    const dispatch = useDispatch();

    if (selectedIds.length === 0) return null;

    const isViewer = currentUser?.role === 'viewer';

    const handleStatusChange = (e) => {
        if (isViewer) {
            dispatch(addToast({ message: 'Viewers cannot modify tasks', type: 'error' }));
            return;
        }
        const colId = e.target.value;
        if (!colId) return;
        dispatch(bulkUpdateStatus({ targetColumnId: colId }));
        dispatch(addToast({ message: `Updated status for ${selectedIds.length} tasks`, type: 'success' }));
    };

    const handleAssigneeChange = (e) => {
        if (isViewer) {
            dispatch(addToast({ message: 'Viewers cannot modify tasks', type: 'error' }));
            return;
        }
        const userId = e.target.value;
        if (!userId) return;
        dispatch(bulkUpdateAssignee({ assigneeId: userId }));
        dispatch(addToast({ message: `Reassigned ${selectedIds.length} tasks`, type: 'success' }));
    };

    const handleDelete = () => {
        if (currentUser?.role === 'owner') {
            const count = selectedIds.length;
            dispatch(bulkDeleteTasks());
            dispatch(addToast({ message: `Deleted ${count} tasks directly by Owner`, type: 'info', canUndo: true }));
        } else if (currentUser?.role === 'admin') {
            const count = selectedIds.length;
            const reqId = 'req-' + Date.now();
            dispatch(createTaskRequest({
                id: reqId,
                type: 'BULK_DELETE_TASK',
                data: {
                    ids: [...selectedIds],
                    title: `${count} selected tasks`
                },
                requestedBy: { id: currentUser.id, name: currentUser.name, role: currentUser.role }
            }));
            dispatch(addNotification({
                title: 'Bulk Delete Request from Admin',
                message: `${currentUser.name} (Admin) requested to delete ${count} tasks.`,
                type: 'approval',
                requestId: reqId
            }));
            dispatch(clearSelectedTasks());
            dispatch(addToast({ message: `Bulk delete request for ${count} tasks sent to Owner for approval.`, type: 'info' }));
        } else {
            dispatch(addToast({
                message: 'Permission Denied: Members and Viewers cannot delete tasks. Only Owner can delete directly.',
                type: 'error'
            }));
        }
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white dark:bg-gray-800 border border-gray-700/80 rounded-2xl shadow-2xl px-5 py-3 flex items-center space-x-4 font-sans text-xs animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center space-x-2 font-semibold">
                <span className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">
                    {selectedIds.length}
                </span>
                <span>Selected</span>
            </div>

            <div className="h-4 w-[1px] bg-gray-700" />

            {/* Change Status */}
            <div className="flex items-center space-x-1.5">
                <Flag size={13} className="text-gray-400" />
                <select
                    onChange={handleStatusChange}
                    defaultValue=""
                    className="bg-gray-800 dark:bg-gray-700 text-white rounded-lg px-2.5 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                    <option value="" disabled>Move to Status...</option>
                    {currentProject?.columns?.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                </select>
            </div>

            {/* Change Assignee */}
            <div className="flex items-center space-x-1.5">
                <User size={13} className="text-gray-400" />
                <select
                    onChange={handleAssigneeChange}
                    defaultValue=""
                    className="bg-gray-800 dark:bg-gray-700 text-white rounded-lg px-2.5 py-1 text-xs border border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                    <option value="" disabled>Assign to...</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>

            {/* Delete button */}
            <button
                onClick={handleDelete}
                title={
                    currentUser?.role === 'owner'
                        ? 'Delete selected tasks directly (Owner)'
                        : currentUser?.role === 'admin'
                        ? 'Request Owner approval to delete selected tasks (Admin)'
                        : 'Members and Viewers cannot delete tasks'
                }
                className={`px-3 py-1 rounded-lg flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    currentUser?.role === 'owner'
                        ? 'bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40'
                        : currentUser?.role === 'admin'
                        ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border border-amber-500/40'
                        : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                }`}
            >
                {currentUser?.role === 'admin' ? <ShieldAlert size={13} /> : <Trash2 size={13} />}
                <span>{currentUser?.role === 'admin' ? 'Request Delete' : 'Delete'}</span>
            </button>

            {/* Clear Selection */}
            <button
                onClick={() => dispatch(clearSelectedTasks())}
                title="Clear selection"
                className="p-1 text-gray-400 hover:text-white rounded transition-colors ml-1"
            >
                <X size={15} />
            </button>
        </div>
    );
}
