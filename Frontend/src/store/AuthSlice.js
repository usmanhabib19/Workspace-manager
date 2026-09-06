import { createSlice } from '@reduxjs/toolkit';
import { initialUsers } from './initialData';

const savedUsers = localStorage.getItem('wm_users');
const savedActiveUserId = localStorage.getItem('wm_active_user_id');

const users = savedUsers ? JSON.parse(savedUsers) : initialUsers;
const activeUser = users.find(u => u.id === savedActiveUserId) || users[0];

const initialState = {
    users,
    currentUser: activeUser,
    isAuthenticated: true // Persistent mock session
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        switchUserPersona: (state, action) => {
            const targetUser = state.users.find(u => u.id === action.payload);
            if (targetUser) {
                state.currentUser = targetUser;
                state.isAuthenticated = true;
                localStorage.setItem('wm_active_user_id', targetUser.id);
            }
        },
        updateUserProfile: (state, action) => {
            const { name, email, avatar } = action.payload;
            if (state.currentUser) {
                if (name) state.currentUser.name = name;
                if (email) state.currentUser.email = email;
                if (avatar) state.currentUser.avatar = avatar;

                // Also update in users list
                const userInList = state.users.find(u => u.id === state.currentUser.id);
                if (userInList) {
                    Object.assign(userInList, { name, email, avatar });
                }
                localStorage.setItem('wm_users', JSON.stringify(state.users));
            }
        },
        login: (state, action) => {
            const { email } = action.payload;
            const existing = state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existing) {
                state.currentUser = existing;
                state.isAuthenticated = true;
                localStorage.setItem('wm_active_user_id', existing.id);
            } else {
                // Register a new mock user
                const newUser = {
                    id: 'u-' + Date.now(),
                    name: action.payload.name || email.split('@')[0],
                    email,
                    role: 'member',
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`
                };
                state.users.push(newUser);
                state.currentUser = newUser;
                state.isAuthenticated = true;
                localStorage.setItem('wm_users', JSON.stringify(state.users));
                localStorage.setItem('wm_active_user_id', newUser.id);
            }
        },
        setCredentials: (state, action) => {
            const user = action.payload.user;
            if (user) {
                state.currentUser = user;
                state.isAuthenticated = true;
                localStorage.setItem('wm_active_user_id', user.id);
            }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            localStorage.removeItem('wm_active_user_id');
        }
    }
});

export const { switchUserPersona, updateUserProfile, login, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;