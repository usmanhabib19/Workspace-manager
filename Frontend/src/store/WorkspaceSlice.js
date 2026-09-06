import { createSlice } from '@reduxjs/toolkit';
import { initialWorkspaces, initialProjects } from './initialData';

const savedWorkspaces = localStorage.getItem('wm_workspaces');
const savedProjects = localStorage.getItem('wm_projects');
const savedActiveWorkspace = localStorage.getItem('wm_active_workspace');
const savedActiveProject = localStorage.getItem('wm_active_project');

const initialState = {
    workspaces: savedWorkspaces ? JSON.parse(savedWorkspaces) : initialWorkspaces,
    activeWorkspaceId: savedActiveWorkspace || 'ws-1',
    projects: savedProjects ? JSON.parse(savedProjects) : initialProjects,
    activeProjectId: savedActiveProject || 'proj-1'
};

const workspaceSlice = createSlice({
    name: 'workspaces',
    initialState,
    reducers: {
        switchWorkspace: (state, action) => {
            state.activeWorkspaceId = action.payload;
            // Also switch active project to first project in this workspace
            const firstProj = state.projects.find(p => p.workspaceId === action.payload && !p.isArchived);
            if (firstProj) {
                state.activeProjectId = firstProj.id;
            }
        },
        createWorkspace: (state, action) => {
            const newWs = {
                id: 'ws-' + Date.now(),
                name: action.payload.name,
                color: action.payload.color || '#0D9488',
                icon: action.payload.icon || 'folder',
                defaultView: action.payload.defaultView || 'kanban',
                members: action.payload.members || [{ userId: 'u-1', role: 'owner' }]
            };
            state.workspaces.push(newWs);
            state.activeWorkspaceId = newWs.id;
        },
        updateWorkspace: (state, action) => {
            const { id, name, color, defaultView } = action.payload;
            const ws = state.workspaces.find(w => w.id === id);
            if (ws) {
                if (name) ws.name = name;
                if (color) ws.color = color;
                if (defaultView) ws.defaultView = defaultView;
            }
        },
        deleteWorkspace: (state, action) => {
            if (state.workspaces.length <= 1) return; // Prevent deleting the last workspace
            state.workspaces = state.workspaces.filter(w => w.id !== action.payload);
            state.projects = state.projects.filter(p => p.workspaceId !== action.payload);
            state.activeWorkspaceId = state.workspaces[0].id;
            const remainingProj = state.projects.find(p => p.workspaceId === state.activeWorkspaceId);
            state.activeProjectId = remainingProj ? remainingProj.id : null;
        },
        inviteWorkspaceMember: (state, action) => {
            const { workspaceId, userId, role = 'member' } = action.payload;
            const ws = state.workspaces.find(w => w.id === workspaceId);
            if (ws && !ws.members.some(m => m.userId === userId)) {
                ws.members.push({ userId, role });
            }
        },
        updateMemberRole: (state, action) => {
            const { workspaceId, userId, role } = action.payload;
            const ws = state.workspaces.find(w => w.id === workspaceId);
            if (ws) {
                const member = ws.members.find(m => m.userId === userId);
                if (member) member.role = role;
            }
        },
        switchProject: (state, action) => {
            state.activeProjectId = action.payload;
        },
        createProject: (state, action) => {
            const { workspaceId, name, description, color, template } = action.payload;
            
            let columns = [
                { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700' },
                { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 text-blue-700' },
                { id: 'review', title: 'In Review / QA', color: 'bg-amber-50 text-amber-700' },
                { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-700' }
            ];

            if (template === 'bug-tracker') {
                columns = [
                    { id: 'reported', title: 'Reported', color: 'bg-red-50 text-red-700' },
                    { id: 'triaged', title: 'Triaged', color: 'bg-orange-50 text-orange-700' },
                    { id: 'fixing', title: 'Fix in Progress', color: 'bg-blue-50 text-blue-700' },
                    { id: 'resolved', title: 'Resolved & Tested', color: 'bg-emerald-50 text-emerald-700' }
                ];
            } else if (template === 'product-roadmap') {
                columns = [
                    { id: 'q1', title: 'Now (Q1)', color: 'bg-teal-50 text-teal-700' },
                    { id: 'q2', title: 'Next (Q2)', color: 'bg-indigo-50 text-indigo-700' },
                    { id: 'future', title: 'Future Horizons', color: 'bg-purple-50 text-purple-700' }
                ];
            }

            const newProj = {
                id: 'proj-' + Date.now(),
                workspaceId: workspaceId || state.activeWorkspaceId,
                name: name || 'Untitled Project',
                description: description || '',
                color: color || '#0D9488',
                icon: 'folder-kanban',
                isArchived: false,
                members: ['u-1', 'u-2', 'u-3', 'u-4'],
                columns
            };

            state.projects.push(newProj);
            state.activeProjectId = newProj.id;
        },
        updateProject: (state, action) => {
            const { id, name, description, color } = action.payload;
            const proj = state.projects.find(p => p.id === id);
            if (proj) {
                if (name) proj.name = name;
                if (description !== undefined) proj.description = description;
                if (color) proj.color = color;
            }
        },
        archiveProject: (state, action) => {
            const proj = state.projects.find(p => p.id === action.payload);
            if (proj) {
                proj.isArchived = !proj.isArchived;
                if (state.activeProjectId === proj.id) {
                    const nextActive = state.projects.find(p => p.workspaceId === proj.workspaceId && !p.isArchived && p.id !== proj.id);
                    if (nextActive) state.activeProjectId = nextActive.id;
                }
            }
        },
        deleteProject: (state, action) => {
            state.projects = state.projects.filter(p => p.id !== action.payload);
            const remaining = state.projects.find(p => p.workspaceId === state.activeWorkspaceId && !p.isArchived);
            state.activeProjectId = remaining ? remaining.id : null;
        },
        reorderProjectColumns: (state, action) => {
            const { projectId, columns } = action.payload;
            const proj = state.projects.find(p => p.id === projectId);
            if (proj) {
                proj.columns = columns;
            }
        },
        importWorkspacesData: (state, action) => {
            if (action.payload.workspaces) state.workspaces = action.payload.workspaces;
            if (action.payload.projects) state.projects = action.payload.projects;
            if (state.workspaces.length > 0) state.activeWorkspaceId = state.workspaces[0].id;
            if (state.projects.length > 0) state.activeProjectId = state.projects[0].id;
        }
    }
});

export const {
    switchWorkspace,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    inviteWorkspaceMember,
    updateMemberRole,
    switchProject,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    reorderProjectColumns,
    importWorkspacesData
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
