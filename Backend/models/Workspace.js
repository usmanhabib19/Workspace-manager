const mongoose = require('mongoose');

/**
 * Workspace Model
 * A workspace is a top-level container (e.g. "Kinetic Workspace").
 *
 * ROLE ASSIGNMENT:
 *  - members array stores { userId, role } pairs.
 *  - The owner is always the user who created the workspace (ownerId).
 *  - Admins, Members, Viewers are added through the workspace settings.
 *
 * DATA SEPARATION:
 *  - All users share the same workspace data, but their access is filtered by role.
 *  - Member and Viewer see the same task data but cannot write.
 *  - Admin sees full data and can request mutations.
 *  - Owner sees full data + pending approval queue.
 */
const workspaceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '🏢'
    },
    color: {
        type: String,
        default: '#14b8a6'    // teal-500
    },

    // The workspace creator (always owner)
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Workspace members with roles
    members: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            default: 'member'
        },
        joinedAt: { type: Date, default: Date.now }
    }],

    // Settings
    settings: {
        allowAdminRequests: { type: Boolean, default: true },   // Allow admin to submit requests
        requireOwnerApproval: { type: Boolean, default: true }, // All admin actions need approval
        defaultView: { type: String, default: 'kanban' }
    },

    isArchived: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model('Workspace', workspaceSchema);
