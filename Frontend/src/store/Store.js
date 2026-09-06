import { configureStore } from '@reduxjs/toolkit';
import authReducer from './AuthSlice';
import workspaceReducer from './WorkspaceSlice';
import taskReducer from './TaskSlice';
import uiReducer from './UiSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        workspaces: workspaceReducer,
        tasks: taskReducer,
        ui: uiReducer,
    },
});

// Auto-save subscriber to localStorage
store.subscribe(() => {
    try {
        const state = store.getState();
        localStorage.setItem('wm_workspaces', JSON.stringify(state.workspaces.workspaces));
        localStorage.setItem('wm_projects', JSON.stringify(state.workspaces.projects));
        localStorage.setItem('wm_active_workspace', state.workspaces.activeWorkspaceId);
        localStorage.setItem('wm_active_project', state.workspaces.activeProjectId || '');
        localStorage.setItem('wm_tasks', JSON.stringify(state.tasks.tasks));
        localStorage.setItem('wm_pending_requests', JSON.stringify(state.tasks.pendingRequests || []));
        localStorage.setItem('wm_theme', state.ui.theme);
        localStorage.setItem('wm_default_view', state.ui.activeView);
    } catch (e) {
        console.warn('Failed to sync state to localStorage:', e);
    }
});

// JSON Export Helper
export const exportWorkspaceJSON = () => {
    const state = store.getState();
    const backupData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        workspaces: state.workspaces.workspaces,
        projects: state.workspaces.projects,
        tasks: state.tasks.tasks
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Reset to Sample Demo Data Helper
export const resetToSampleData = () => {
    localStorage.removeItem('wm_workspaces');
    localStorage.removeItem('wm_projects');
    localStorage.removeItem('wm_tasks');
    localStorage.removeItem('wm_users');
    localStorage.removeItem('wm_active_workspace');
    localStorage.removeItem('wm_active_project');
    localStorage.removeItem('wm_active_user_id');
    window.location.reload();
};