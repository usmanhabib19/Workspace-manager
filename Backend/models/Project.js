const mongoose = require('mongoose');

/**
 * Project Model
 * A project lives inside a workspace and contains kanban columns + tasks.
 *
 * PERMISSION NOTES:
 *  - All members of the workspace can view projects.
 *  - Only owner can create/archive/delete projects.
 *  - Admin can request project creation through a PendingRequest.
 *  - Members and Viewers have read-only access.
 */
const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    emoji: {
        type: String,
        default: '📁'
    },
    color: {
        type: String,
        default: '#14b8a6'
    },

    // Parent workspace
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },

    // Kanban columns definition
    columns: [{
        _id: false,
        id: { type: String, required: true },       // e.g. 'backlog', 'inprogress'
        title: { type: String, required: true },    // e.g. 'Backlog', 'In Progress'
        color: { type: String, default: '' },       // Tailwind classes for badge color
        order: { type: Number, default: 0 }
    }],

    // Members with project-specific overrides (optional; workspace role applies by default)
    members: [{
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
            type: String,
            enum: ['owner', 'admin', 'member', 'viewer'],
            default: 'member'
        }
    }],

    isArchived: {
        type: Boolean,
        default: false
    },

    sprintName: {
        type: String,
        default: ''
    },
    sprintStartDate: {
        type: String,
        default: null
    },
    sprintEndDate: {
        type: String,
        default: null
    }

}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
