import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KanbanView from './pages/Dashboard/KanbanView';
import ListView from './pages/Dashboard/ListView';
import CalendarView from './pages/Dashboard/CalendarView';
import TaskDetailModal from './components/TaskDetailModal';
import WorkspaceSettingsModal from './components/WorkspaceSettingsModal';
import CommandPalette from './components/CommandPalette';
import BulkActionBar from './components/BulkActionBar';
import ToastContainer from './components/ToastContainer';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import { useSimulatedLiveUpdates } from './utils/simulatedLiveUpdates';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Public / Guest Only Route Wrapper
function PublicRoute({ children }) {
    const isAuthenticated = useSelector((state) => state.auth?.isAuthenticated);
    return isAuthenticated ? <Navigate to="/" replace /> : children;
}

// Main Workspace Dashboard Layout
function DashboardLayout() {
    const activeView = useSelector((state) => state.ui.activeView);
    const theme = useSelector((state) => state.ui.theme);

    // Simulated live collaborative updates (Domain 9)
    useSimulatedLiveUpdates();

    // Apply dark mode class to root html/body
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-neutral-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors">
            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                {/* Top Header */}
                <Header />

                {/* Dynamic View Representation (Domain 5) */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col min-w-0">
                    {activeView === 'kanban' && <KanbanView />}
                    {activeView === 'list' && <ListView />}
                    {activeView === 'calendar' && <CalendarView />}
                </div>
            </main>

            {/* Global Modals & Overlays */}
            <TaskDetailModal />
            <WorkspaceSettingsModal />
            <CommandPalette />
            <BulkActionBar />
            <ToastContainer />
        </div>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Auth Routes */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* Protected Dashboard Route */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}