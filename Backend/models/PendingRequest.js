const mongoose = require('mongoose');

/**
 * PendingRequest Model
 * Stores Admin requests for Owner approval before actions are executed.
 *
 * REQUEST TYPES:
 *  - ADD_TASK        : Admin wants to create a new task
 *  - DELETE_TASK     : Admin wants to delete a specific task
 *  - BULK_DELETE_TASK: Admin wants to delete multiple selected tasks
 *  - MOVE_TASK       : Admin drag-and-dropped a task to a different column
 *
 * WORKFLOW:
 *  1. Admin performs an action (add/delete/move).
 *  2. Instead of executing, a PendingRequest document is created here.
 *  3. Owner receives a notification.
 *  4. Owner reviews: clicks Accept → request.status = 'approved' → action executes.
 *                    clicks Reject  → request.status = 'rejected' → action cancelled.
 *
 * MEMBER/VIEWER:
 *  - Members and Viewers have NO write access — they cannot create PendingRequests either.
 *  - The API middleware enforces this based on User.role.
 */
const pendingRequestSchema = new mongoose.Schema({

    // Type of action being requested
    type: {
        type: String,
        required: true,
        enum: ['ADD_TASK', 'DELETE_TASK', 'BULK_DELETE_TASK', 'MOVE_TASK']
    },

    // Payload of the action (what to create/delete/move)
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
        /**
         * For ADD_TASK:
         *   { projectId, columnId, title, description, priority, tag, assigneeId }
         *
         * For DELETE_TASK:
         *   { id: taskId, title: taskTitle }
         *
         * For BULK_DELETE_TASK:
         *   { ids: [taskId1, taskId2, ...], title: "3 selected tasks" }
         *
         * For MOVE_TASK:
         *   { taskId, taskTitle, fromColumnId, fromColumnTitle, targetColumnId, targetColumnTitle }
         */
    },

    // The Admin who submitted this request
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Snapshot of requestedBy info (so it shows even if user is deleted)
    requestedBySnapshot: {
        id: String,
        name: String,
        role: String,
        avatar: String
    },

    // Current status of the request
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    // Owner who reviewed it (set when approved/rejected)
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // When it was reviewed
    reviewedAt: {
        type: Date,
        default: null
    },

    // Which workspace/project this belongs to
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        default: null
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null
    }

}, { timestamps: true });

// Index for fast owner dashboard queries
pendingRequestSchema.index({ status: 1, workspaceId: 1, createdAt: -1 });

module.exports = mongoose.model('PendingRequest', pendingRequestSchema);
