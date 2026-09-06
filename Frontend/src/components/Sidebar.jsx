import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    switchWorkspace,
    switchProject,
    archiveProject,
    deleteProject
} from '../store/WorkspaceSlice';
import { switchUserPersona, logout } from '../store/AuthSlice';
import { setSettingsModalOpen, addToast } from '../store/UiSlice';
import {
    FolderKanban, ChevronDown, Plus, Settings, LogOut,
    Check, Trash2, Archive, UserCheck, Edit3
} from 'lucide-react';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import CreateProjectModal from './CreateProjectModal';
import UserProfileModal from './UserProfileModal';

export default function Sidebar() {
    const workspaces = useSelector((state) => state.workspaces.workspaces);
    const activeWorkspaceId = useSelector((state) => state.workspaces.activeWorkspaceId);
    const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
    
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const workspaceProjects = projects.filter(p => p.workspaceId === activeWorkspaceId && !p.isArchived);
    const archivedProjects = projects.filter(p => p.workspaceId === activeWorkspaceId && p.isArchived);

    const users = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);

    const dispatch = useDispatch();

    const [isWsDropdownOpen, setIsWsDropdownOpen] = useState(false);
    const [isUserSwitcherOpen, setIsUserSwitcherOpen] = useState(false);
    const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
    const [isCreateProjOpen, setIsCreateProjOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const isViewer = currentUser?.role === 'viewer';

    return (
        <>
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between h-screen shrink-0 font-sans z-10 select-none">
                <div className="p-4 flex flex-col h-full overflow-hidden">

                    {/* Workspace Switcher Header */}
                    <div className="relative mb-5">
                        <div
                            onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-gray-800 cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                        >
                            <div className="flex items-center space-x-2.5 min-w-0">
                                <div
                                    className="h-7 w-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0"
                                    style={{ backgroundColor: currentWorkspace?.color || '#0D9488' }}
                                >
                                    {currentWorkspace?.name ? currentWorkspace.name.charAt(0).toUpperCase() : 'W'}
                                </div>
                                <div className="truncate">
                                    <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                                        {currentWorkspace?.name || 'My Workspace'}
                                    </p>
                                    <p className="text-[10px] text-gray-400 capitalize">
                                        Role: {currentUser?.role}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0" />
                        </div>

                        {/* Workspace Dropdown */}
                        {isWsDropdownOpen && (
                            <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-30 text-xs py-1 animate-in fade-in zoom-in-95 duration-100">
                                <p className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Switch Workspace
                                </p>
                                {workspaces.map(ws => (
                                    <button
                                        key={ws.id}
                                        onClick={() => {
                                            dispatch(switchWorkspace(ws.id));
                                            setIsWsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-gray-800 text-left transition-colors"
                                    >
                                        <div className="flex items-center space-x-2 truncate">
                                            <div className="h-4 w-4 rounded-md shrink-0" style={{ backgroundColor: ws.color }} />
                                            <span className="truncate text-gray-800 dark:text-gray-200 font-medium">{ws.name}</span>
                                        </div>
                                        {ws.id === activeWorkspaceId && <Check size={14} className="text-primary shrink-0" />}
                                    </button>
                                ))}

                                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                                <button
                                    onClick={() => {
                                        setIsCreateWsOpen(true);
                                        setIsWsDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-primary hover:bg-teal-50 dark:hover:bg-teal-950 font-medium transition-colors"
                                >
                                    <Plus size={14} />
                                    <span>Create Workspace</span>
                                </button>

                                <button
                                    onClick={() => {
                                        dispatch(setSettingsModalOpen(true));
                                        setIsWsDropdownOpen(false);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Settings size={14} />
                                    <span>Workspace Settings</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Projects Section */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                Projects ({workspaceProjects.length})
                            </span>
                            {!isViewer && (
                                <button
                                    onClick={() => setIsCreateProjOpen(true)}
                                    title="Create project from template"
                                    className="h-5 w-5 rounded-md hover:bg-neutral-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary flex items-center justify-center transition-colors"
                                >
                                    <Plus size={13} />
                                </button>
                            )}
                        </div>

                        {/* Projects List */}
                        <div className="space-y-1">
                            {workspaceProjects.map(proj => {
                                const isActive = proj.id === activeProjectId;
                                return (
                                    <div
                                        key={proj.id}
                                        onClick={() => dispatch(switchProject(proj.id))}
                                        className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                                            isActive
                                                ? 'bg-primary/10 text-primary font-semibold'
                                                : 'text-gray-600 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2.5 truncate">
                                            <FolderKanban size={15} style={{ color: proj.color }} className="shrink-0" />
                                            <span className="truncate">{proj.name}</span>
                                        </div>

                                        {!isViewer && (
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dispatch(archiveProject(proj.id));
                                                        dispatch(addToast({ message: `Project archived`, type: 'info' }));
                                                    }}
                                                    title="Archive project"
                                                    className="p-0.5 text-gray-400 hover:text-amber-500 rounded"
                                                >
                                                    <Archive size={12} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Delete project "${proj.name}"?`)) {
                                                            dispatch(deleteProject(proj.id));
                                                            dispatch(addToast({ message: 'Project deleted', type: 'info' }));
                                                        }
                                                    }}
                                                    title="Delete project"
                                                    className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Archived Projects Accordion */}
                        {archivedProjects.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="flex items-center justify-between w-full text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1"
                                >
                                    <span>Archived ({archivedProjects.length})</span>
                                    <ChevronDown size={12} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                                </button>
                                {showArchived && (
                                    <div className="space-y-1 mt-1 pl-2">
                                        {archivedProjects.map(p => (
                                            <div key={p.id} className="flex items-center justify-between text-xs text-gray-400 py-1">
                                                <span className="truncate">{p.name}</span>
                                                <button
                                                    onClick={() => dispatch(archiveProject(p.id))}
                                                    className="text-[10px] text-primary hover:underline"
                                                >
                                                    Restore
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer: User Profile & Multi-User Switcher */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto relative">
                        
                        {/* User Persona Switcher Dropdown */}
                        {isUserSwitcherOpen && (
                            <div className="absolute left-0 bottom-full mb-2 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-30 text-xs py-1 animate-in fade-in zoom-in-95 duration-100">
                                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1">
                                    <UserCheck size={12} />
                                    <span>Switch Role Persona</span>
                                </p>
                                {users.map(u => (
                                    <button
                                        key={u.id}
                                        onClick={() => {
                                            dispatch(switchUserPersona(u.id));
                                            setIsUserSwitcherOpen(false);
                                            dispatch(addToast({ message: `Switched to ${u.name} (${u.role})`, type: 'info' }));
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-neutral-100 dark:hover:bg-gray-800 text-left transition-colors"
                                    >
                                        <div className="flex items-center space-x-2 truncate">
                                            <img src={u.avatar} alt={u.name} className="h-6 w-6 rounded-full border border-gray-200 shrink-0" />
                                            <div className="truncate">
                                                <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">{u.name}</p>
                                                <p className="text-[10px] text-gray-400 capitalize">{u.role}</p>
                                            </div>
                                        </div>
                                        {u.id === currentUser?.id && <Check size={14} className="text-primary shrink-0" />}
                                    </button>
                                ))}

                                <div className="border-t border-gray-100 dark:border-gray-800 my-1" />

                                <button
                                    onClick={() => {
                                        setIsProfileModalOpen(true);
                                        setIsUserSwitcherOpen(false);
                                    }}
                                    className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <Edit3 size={13} />
                                    <span>Edit Profile</span>
                                </button>
                            </div>
                        )}

                        {/* Current User Card */}
                        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors">
                            <div
                                onClick={() => setIsUserSwitcherOpen(!isUserSwitcherOpen)}
                                className="flex items-center space-x-2.5 overflow-hidden cursor-pointer flex-1 min-w-0"
                                title="Click to switch simulated user persona"
                            >
                                <div className="h-8 w-8 rounded-full bg-teal-100 overflow-hidden shrink-0 border border-gray-200">
                                    <img
                                        src={currentUser?.avatar}
                                        alt="User Avatar"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="text-left truncate">
                                    <div className="flex items-center space-x-1">
                                        <p className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                                            {currentUser?.name || 'Usman'}
                                        </p>
                                    </div>
                                    <p className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                        {currentUser?.role}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => dispatch(logout())}
                                title="Log Out"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors cursor-pointer"
                            >
                                <LogOut size={15} />
                            </button>
                        </div>

                    </div>

                </div>
            </aside>

            {/* Modals */}
            <CreateWorkspaceModal isOpen={isCreateWsOpen} onClose={() => setIsCreateWsOpen(false)} />
            <CreateProjectModal isOpen={isCreateProjOpen} onClose={() => setIsCreateProjOpen(false)} />
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </>
    );
}