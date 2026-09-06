const mongoose = require('mongoose');

/**
 * Task Model
 * Stores all tasks across projects.
 *
 * ROLE-BASED PERMISSIONS (enforced by API middleware):
 *  - owner  : Can CREATE, UPDATE (including move/columnId), DELETE directly.
 *  - admin  : Cannot create/delete/move directly. Creates PendingRequest instead.
 *  - member : Can VIEW only. No write operations.
 *  - viewer : Can VIEW only. No write operations. Even more restricted UI.
 *
 * MEMBER vs VIEWER DATA IN MONGODB:
 *  - Both member and viewer read from the same `tasks` collection.
 *  - The difference is that:
 *      * Member can see all task fields (title, description, assignee, comments, etc.)
 *      * Viewer also reads the same data but the API can strip sensitive fields if needed.
 *  - No separate collection needed; role is on the User document.
 *  - The API middleware checks req.user.role before allowing any write.
 */
const taskSchema = new mongoose.Schema({
    // Basic info
    title: {
        type: String,
        required: [true, 'Task title is required'],
        trim: true
    },
    description: {
        type: String,
        default: ''
    },

    // Board placement
    columnId: {
        type: String,
        required: true,
        default: 'backlog',
        enum: ['backlog', 'inprogress', 'review', 'done', 'blocked']
    },

    // Relationships
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: false
    },
    assigneeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdById: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // Metadata
    tag: {
        type: String,
        default: 'General'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    dueDate: {
        type: String,   // ISO date string e.g. "2026-09-30"
        default: null
    },
    completed: {
        type: Boolean,
        default: false
    },

    // Subtasks (embedded)
    subtasks: [{
        _id: false,
        id: String,
        title: String,
        completed: { type: Boolean, default: false }
    }],

    // Attachments metadata (actual files stored in cloud or base64 for demo)
    attachments: [{
        _id: false,
        id: String,
        name: String,
        size: String,
        type: String,
        dataUrl: String,     // base64 for frontend demo; replace with S3 URL in production
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Comments
    comments: [{
        _id: false,
        id: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],

    // Activity log
    activity: [{
        _id: false,
        id: String,
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: String,
        time: String
    }]

}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);