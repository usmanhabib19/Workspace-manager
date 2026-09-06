import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSettingsModalOpen, addToast } from '../store/UiSlice';
import { updateWorkspace, deleteWorkspace, inviteWorkspaceMember, updateMemberRole, importWorkspacesData } from '../store/WorkspaceSlice';
import { importTasksData } from '../store/TaskSlice';
import { exportWorkspaceJSON, resetToSampleData } from '../store/Store';
import {
    X, Settings, Users, Download, Upload, RefreshCw, Trash2,
    Shield, UserPlus, AlertTriangle
} from 'lucide-react';

export default function WorkspaceSettingsModal() {
    const isOpen = useSelector((state) => state.ui.isSettingsModalOpen);
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const activeWorkspaceId = useSelector((state) => state.workspaces.activeWorkspaceId);
    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    const allUsers = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);

    const dispatch = useDispatch();

    const [activeTab, setActiveTab] = useState('general'); // 'general', 'members', 'data', 'danger'
    const [wsName, setWsName] = useState(currentWorkspace?.name || '');
    const [wsColor, setWsColor] = useState(currentWorkspace?.color || '#0D9488');
    const [defaultView, setDefaultView] = useState(currentWorkspace?.defaultView || 'kanban');
    const [selectedInviteUser, setSelectedInviteUser] = useState('');
    const [selectedInviteRole, setSelectedInviteRole] = useState('member');

    const fileInputRef = useRef(null);

    if (!isOpen || !currentWorkspace) return null;

    const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin';

    const handleSaveGeneral = (e) => {
        e.preventDefault();
        if (!isOwnerOrAdmin) {
            dispatch(addToast({ message: 'Only Workspace Owners & Admins can change settings.', type: 'error' }));
            return;
        }
        dispatch(updateWorkspace({
            id: currentWorkspace.id,
            name: wsName,
            color: wsColor,
            defaultView
        }));
        dispatch(addToast({ message: 'Workspace settings updated', type: 'success' }));
    };

    const handleInvite = (e) => {
        e.preventDefault();
        if (!selectedInviteUser) return;
        dispatch(inviteWorkspaceMember({
            workspaceId: currentWorkspace.id,
            userId: selectedInviteUser,
            role: selectedInviteRole
        }));
        dispatch(addToast({ message: 'Member added to workspace', type: 'success' }));
        setSelectedInviteUser('');
    };

    const handleRoleChange = (userId, newRole) => {
        if (!isOwnerOrAdmin) return;
        dispatch(updateMemberRole({
            workspaceId: currentWorkspace.id,
            userId,
            role: newRole
        }));
        dispatch(addToast({ message: 'Member role updated', type: 'info' }));
    };

    const handleDeleteWorkspace = () => {
        if (workspaces.length <= 1) {
            dispatch(addToast({ message: 'Cannot delete the only remaining workspace.', type: 'error' }));
            return;
        }
        if (window.confirm(`Are you sure you want to delete workspace "${currentWorkspace.name}"?`)) {
            dispatch(deleteWorkspace(currentWorkspace.id));
            dispatch(setSettingsModalOpen(false));
            dispatch(addToast({ message: 'Workspace deleted', type: 'info' }));
        }
    };

    const handleImportJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvt) => {
            try {
                const parsed = JSON.parse(loadEvt.target.result);
                if (parsed.workspaces && parsed.tasks) {
                    dispatch(importWorkspacesData({ workspaces: parsed.workspaces, projects: parsed.projects }));
                    dispatch(importTasksData(parsed.tasks));
                    dispatch(addToast({ message: 'Workspace data imported successfully!', type: 'success' }));
                    dispatch(setSettingsModalOpen(false));
                } else {
                    dispatch(addToast({ message: 'Invalid JSON workspace schema.', type: 'error' }));
                }
            } catch (err) {
                dispatch(addToast({ message: 'Failed to parse JSON file.', type: 'error' }));
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-950/50">
                    <div className="flex items-center space-x-2.5">
                        <Settings size={18} className="text-primary" />
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                            Workspace Settings: {currentWorkspace.name}
                        </h3>
                    </div>
                    <button
                        onClick={() => dispatch(setSettingsModalOpen(false))}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 px-6 bg-neutral-50/30 dark:bg-gray-950/30 text-xs">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        General
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'members' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Members & Roles
                    </button>
                    <button
                        onClick={() => setActiveTab('data')}
                        className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'data' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Import / Export
                    </button>
                    <button
                        onClick={() => setActiveTab('danger')}
                        className={`py-3 px-3 font-semibold border-b-2 transition-colors cursor-pointer ${activeTab === 'danger' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Danger Zone
                    </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                    Workspace Name
                                </label>
                                <input
                                    type="text"
                                    value={wsName}
                                    disabled={!isOwnerOrAdmin}
                                    onChange={(e) => setWsName(e.target.value)}
                                    className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3.5 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        Brand Color
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={wsColor}
                                            disabled={!isOwnerOrAdmin}
                                            onChange={(e) => setWsColor(e.target.value)}
                                            className="h-9 w-9 rounded-lg border border-gray-200 cursor-pointer"
                                        />
                                        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{wsColor}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                        Default View
                                    </label>
                                    <select
                                        value={defaultView}
                                        disabled={!isOwnerOrAdmin}
                                        onChange={(e) => setDefaultView(e.target.value)}
                                        className="w-full bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                                    >
                                        <option value="kanban">Kanban Board</option>
                                        <option value="list">List / Table</option>
                                        <option value="calendar">Calendar</option>
                                    </select>
                                </div>
                            </div>

                            {isOwnerOrAdmin && (
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium shadow-sm transition-colors cursor-pointer"
                                >
                                    Save Changes
                                </button>
                            )}
                        </form>
                    )}

                    {/* Members & Roles Tab */}
                    {activeTab === 'members' && (
                        <div className="space-y-5 text-xs">
                            {/* Invite Form */}
                            {isOwnerOrAdmin && (
                                <form onSubmit={handleInvite} className="p-3.5 rounded-xl bg-neutral-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                                    <UserPlus size={16} className="text-primary shrink-0" />
                                    <select
                                        value={selectedInviteUser}
                                        onChange={(e) => setSelectedInviteUser(e.target.value)}
                                        className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                                        required
                                    >
                                        <option value="">Select a user to invite...</option>
                                        {allUsers
                                            .filter(u => !currentWorkspace.members.some(m => m.userId === u.id))
                                            .map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                            ))}
                                    </select>

                                    <select
                                        value={selectedInviteRole}
                                        onChange={(e) => setSelectedInviteRole(e.target.value)}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        <option value="viewer">Viewer</option>
                                    </select>

                                    <button
                                        type="submit"
                                        className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                        Invite
                                    </button>
                                </form>
                            )}

                            {/* Current Members List */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
                                    Workspace Members ({currentWorkspace.members.length})
                                </h4>
                                <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
                                    {currentWorkspace.members.map(member => {
                                        const userObj = allUsers.find(u => u.id === member.userId);
                                        return (
                                            <div key={member.userId} className="flex items-center justify-between p-3">
                                                <div className="flex items-center space-x-3">
                                                    <img
                                                        src={userObj?.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=User'}
                                                        alt={userObj?.name}
                                                        className="h-8 w-8 rounded-full border border-gray-200 shrink-0"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-gray-100">{userObj?.name || 'Unknown'}</p>
                                                        <p className="text-[11px] text-gray-400">{userObj?.email}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <select
                                                        value={member.role}
                                                        disabled={!isOwnerOrAdmin || member.role === 'owner'}
                                                        onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                                                        className="bg-neutral-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none capitalize"
                                                    >
                                                        <option value="owner">Owner</option>
                                                        <option value="admin">Admin</option>
                                                        <option value="member">Member</option>
                                                        <option value="viewer">Viewer</option>
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Data Persistence Tab */}
                    {activeTab === 'data' && (
                        <div className="space-y-4 text-xs">
                            <p className="text-gray-500">
                                Export your workspace to JSON for backups, or restore past state from a backup file.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        exportWorkspaceJSON();
                                        dispatch(addToast({ message: 'Backup JSON downloaded', type: 'success' }));
                                    }}
                                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary bg-neutral-50/50 dark:bg-gray-800/40 text-left transition-all flex items-start space-x-3 cursor-pointer group"
                                >
                                    <Download size={20} className="text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">Export as JSON</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Download workspaces, projects, and tasks backup</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary bg-neutral-50/50 dark:bg-gray-800/40 text-left transition-all flex items-start space-x-3 cursor-pointer group"
                                >
                                    <Upload size={20} className="text-blue-500 mt-0.5 group-hover:scale-110 transition-transform" />
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">Import from JSON</p>
                                        <p className="text-[11px] text-gray-400 mt-0.5">Upload a previously exported backup file</p>
                                    </div>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleImportJSON}
                                    className="hidden"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={() => {
                                        if (window.confirm('Reset workspace to initial sample demo data? This will overwrite existing local changes.')) {
                                            resetToSampleData();
                                        }
                                    }}
                                    className="px-3.5 py-2 text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg flex items-center space-x-2 transition-colors cursor-pointer"
                                >
                                    <RefreshCw size={14} />
                                    <span>Reset to Sample Demo Data</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Tab */}
                    {activeTab === 'danger' && (
                        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/30 space-y-3 text-xs">
                            <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 font-bold">
                                <AlertTriangle size={16} />
                                <span>Delete this Workspace</span>
                            </div>
                            <p className="text-red-600 dark:text-red-300 text-xs leading-relaxed">
                                Deleting this workspace will permanently remove all associated projects and tasks from your browser's storage. This action cannot be undone.
                            </p>
                            <button
                                onClick={handleDeleteWorkspace}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                            >
                                Delete Workspace
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
