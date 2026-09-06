import { createSlice } from '@reduxjs/toolkit';
import { initialNotifications } from './initialData';

const savedTheme = localStorage.getItem('wm_theme') || 'light';
const savedView = localStorage.getItem('wm_default_view') || 'kanban';

const initialState = {
    theme: savedTheme, // 'light' or 'dark'
    activeView: savedView, // 'kanban', 'list', 'calendar'
    groupBy: 'status', // 'status', 'priority', 'assignee', 'tag'
    sortBy: 'dueDate', // 'dueDate', 'priority', 'title'
    searchQuery: '',
    filters: {
        assignee: 'all',
        priority: 'all',
        status: 'all',
        tag: 'all'
    },
    savedPresets: [
        { id: 'preset-1', name: 'My Open Tasks', filter: { assignee: 'u-1', status: 'all', priority: 'all', tag: 'all' } },
        { id: 'preset-2', name: 'Urgent Sprints', filter: { assignee: 'all', status: 'all', priority: 'urgent', tag: 'all' } }
    ],
    isCommandPaletteOpen: false,
    isSettingsModalOpen: false,
    notifications: initialNotifications,
    notificationPreferences: {
        assigned: true,
        mention: true,
        due: true
    },
    toasts: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('wm_theme', state.theme);
        },
        setTheme: (state, action) => {
            state.theme = action.payload;
            localStorage.setItem('wm_theme', state.theme);
        },
        setActiveView: (state, action) => {
            state.activeView = action.payload;
            localStorage.setItem('wm_default_view', action.payload);
        },
        setGroupBy: (state, action) => {
            state.groupBy = action.payload;
        },
        setSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setFilter: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        resetFilters: (state) => {
            state.filters = { assignee: 'all', priority: 'all', status: 'all', tag: 'all' };
            state.searchQuery = '';
        },
        applyPreset: (state, action) => {
            const preset = state.savedPresets.find(p => p.id === action.payload);
            if (preset) {
                state.filters = { ...preset.filter };
            }
        },
        saveCurrentFilterAsPreset: (state, action) => {
            state.savedPresets.push({
                id: 'preset-' + Date.now(),
                name: action.payload.name || 'Custom Preset',
                filter: { ...state.filters }
            });
        },
        setCommandPaletteOpen: (state, action) => {
            state.isCommandPaletteOpen = action.payload;
        },
        setSettingsModalOpen: (state, action) => {
            state.isSettingsModalOpen = action.payload;
        },
        // Toasts with inline Undo
        addToast: (state, action) => {
            const newToast = {
                id: 'toast-' + Date.now(),
                message: action.payload.message,
                type: action.payload.type || 'info', // 'success', 'info', 'error'
                canUndo: !!action.payload.canUndo
            };
            state.toasts.push(newToast);
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(t => t.id !== action.payload);
        },
        // Notifications
        addNotification: (state, action) => {
            state.notifications.unshift({
                id: 'notif-' + Date.now(),
                title: action.payload.title,
                message: action.payload.message,
                time: 'Just now',
                isRead: false,
                type: action.payload.type || 'assigned'
            });
        },
        markNotificationRead: (state, action) => {
            const notif = state.notifications.find(n => n.id === action.payload);
            if (notif) notif.isRead = true;
        },
        markAllNotificationsRead: (state) => {
            state.notifications.forEach(n => { n.isRead = true; });
        },
        toggleNotificationPreference: (state, action) => {
            const key = action.payload; // 'assigned', 'mention', 'due'
            if (state.notificationPreferences[key] !== undefined) {
                state.notificationPreferences[key] = !state.notificationPreferences[key];
            }
        },
        // Offline status
        setOnlineStatus: (state, action) => {
            state.isOnline = action.payload;
        },
        triggerFakeSync: (state) => {
            state.isSyncing = true;
        },
        finishFakeSync: (state) => {
            state.isSyncing = false;
        }
    }
});

export const {
    toggleTheme,
    setTheme,
    setActiveView,
    setGroupBy,
    setSortBy,
    setSearchQuery,
    setFilter,
    resetFilters,
    applyPreset,
    saveCurrentFilterAsPreset,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    addToast,
    removeToast,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    toggleNotificationPreference,
    setOnlineStatus,
    triggerFakeSync,
    finishFakeSync
} = uiSlice.actions;

export default uiSlice.reducer;
