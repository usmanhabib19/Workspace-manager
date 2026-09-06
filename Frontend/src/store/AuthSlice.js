import { createSlice } from '@reduxjs/toolkit';
import { initialUsers } from './initialData';

const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL || 'mu801710@gmail.com').trim().toLowerCase();

const savedUsers = localStorage.getItem('wm_users');
const savedActiveUserId = localStorage.getItem('wm_active_user_id');
const savedCurrentUser = localStorage.getItem('wm_current_user');

let users = savedUsers ? JSON.parse(savedUsers) : initialUsers;

// Ensure initial users list has the correct .env owner
const ownerExists = users.some(u => u.email?.toLowerCase() === OWNER_EMAIL);
if (!ownerExists) {
    users.unshift({
        id: 'u-owner-1',
        name: 'Muhammad Usman (Owner)',
        email: OWNER_EMAIL,
        role: 'owner',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Muhammad%20Usman`
    });
}

let activeUser = null;
if (savedCurrentUser) {
    try {
        activeUser = JSON.parse(savedCurrentUser);
    } catch {
        activeUser = null;
    }
}
if (!activeUser && savedActiveUserId) {
    activeUser = users.find(u => u.id === savedActiveUserId);
}
if (!activeUser && users.length > 0) {
    activeUser = users[0];
}

const initialState = {
    users,
    currentUser: activeUser,
    isAuthenticated: !!activeUser,
    ownerEmail: OWNER_EMAIL
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        switchUserPersona: (state, action) => {
            const targetUser = state.users.find(u => u.id === action.payload);
            if (targetUser) {
                // Ensure only .env email can be 'owner'
                const isOwner = targetUser.email?.toLowerCase() === OWNER_EMAIL;
                state.currentUser = {
                    ...targetUser,
                    role: isOwner ? 'owner' : (targetUser.role === 'owner' ? 'member' : targetUser.role)
                };
                state.isAuthenticated = true;
                localStorage.setItem('wm_active_user_id', targetUser.id);
                localStorage.setItem('wm_current_user', JSON.stringify(state.currentUser));
            }
        },
        updateUserProfile: (state, action) => {
            const { name, email, avatar } = action.payload;
            if (state.currentUser) {
                if (name) state.currentUser.name = name;
                if (email) {
                    state.currentUser.email = email;
                    // Recalculate role based on .env owner email
                    state.currentUser.role = email.toLowerCase() === OWNER_EMAIL ? 'owner' : 'member';
                }
                if (avatar) state.currentUser.avatar = avatar;

                const userInList = state.users.find(u => u.id === state.currentUser.id);
                if (userInList) {
                    Object.assign(userInList, { name, email, avatar, role: state.currentUser.role });
                }
                localStorage.setItem('wm_users', JSON.stringify(state.users));
                localStorage.setItem('wm_current_user', JSON.stringify(state.currentUser));
            }
        },
        login: (state, action) => {
            const { email, name } = action.payload;
            const normalizedEmail = email.trim().toLowerCase();
            const isOwner = normalizedEmail === OWNER_EMAIL;
            const assignedRole = isOwner ? 'owner' : 'member';

            const existingIndex = state.users.findIndex(u => u.email?.toLowerCase() === normalizedEmail);
            let userObj;

            if (existingIndex >= 0) {
                userObj = { ...state.users[existingIndex], role: assignedRole };
                if (name) userObj.name = name;
                state.users[existingIndex] = userObj;
            } else {
                userObj = {
                    id: 'u-' + Date.now(),
                    name: name || email.split('@')[0],
                    email: normalizedEmail,
                    role: assignedRole,
                    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || email)}`
                };
                state.users.push(userObj);
            }

            state.currentUser = userObj;
            state.isAuthenticated = true;
            localStorage.setItem('wm_users', JSON.stringify(state.users));
            localStorage.setItem('wm_active_user_id', userObj.id);
            localStorage.setItem('wm_current_user', JSON.stringify(userObj));
        },
        setCredentials: (state, action) => {
            const user = action.payload.user;
            const token = action.payload.token;
            if (user) {
                const normalizedEmail = user.email ? user.email.trim().toLowerCase() : '';
                const isOwner = normalizedEmail === OWNER_EMAIL;
                const role = isOwner ? 'owner' : (user.role === 'owner' ? 'member' : (user.role || 'member'));

                const userObj = {
                    ...user,
                    role
                };

                const existingIndex = state.users.findIndex(u => u.id === user.id || u.email?.toLowerCase() === normalizedEmail);
                if (existingIndex >= 0) {
                    state.users[existingIndex] = { ...state.users[existingIndex], ...userObj };
                } else {
                    state.users.push(userObj);
                }

                state.currentUser = userObj;
                state.isAuthenticated = true;
                if (token) localStorage.setItem('wm_token', token);
                localStorage.setItem('wm_users', JSON.stringify(state.users));
                localStorage.setItem('wm_active_user_id', user.id);
                localStorage.setItem('wm_current_user', JSON.stringify(userObj));
            }
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.currentUser = null;
            localStorage.removeItem('wm_token');
            localStorage.removeItem('wm_active_user_id');
            localStorage.removeItem('wm_current_user');
        }
    }
});

export const { switchUserPersona, updateUserProfile, login, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;