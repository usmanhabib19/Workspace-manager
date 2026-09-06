const mongoose = require('mongoose');

/**
 * User Model
 * Stores all workspace members. Role determines what actions they can perform.
 *
 * ROLES:
 *  - owner  : Full access. Can create/delete tasks directly. Can approve/reject Admin requests.
 *  - admin  : Cannot create/delete tasks directly. Must request Owner approval for add/delete/move.
 *  - member : Read-only for tasks. Cannot add, delete, or move tasks.
 *  - viewer : Strictly read-only. Cannot modify anything.
 *
 * DATA SEPARATION IN MONGODB:
 *  - Each user document has a `role` and `workspaceId` field.
 *  - All users live in the `users` collection.
 *  - Permissions are enforced at the API middleware level using the `role` field.
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6
    },
    avatar: {
        type: String,
        default: function () {
            return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(this.name || 'User')}`;
        }
    },

    // Role within the workspace
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member'
    },

    // The workspace this user belongs to
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        default: null
    },

    // Notification preferences
    notificationPreferences: {
        assigned: { type: Boolean, default: true },
        mention: { type: Boolean, default: true },
        due: { type: Boolean, default: true }
    },

    // Whether the user account is active
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
