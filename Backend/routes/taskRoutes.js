const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { protect, requireOwner, requireAdmin, blockReadOnly } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────
// GET ALL TASKS   (all roles can view)
// ─────────────────────────────────────────────────────────
/**
 * GET /api/tasks
 * Returns all tasks. All roles (owner, admin, member, viewer) can read.
 * Optional query: ?projectId=xxx&columnId=backlog&assigneeId=xxx
 */
router.get('/', protect, async (req, res) => {
    try {
        const filter = {};
        if (req.query.projectId)  filter.projectId  = req.query.projectId;
        if (req.query.columnId)   filter.columnId   = req.query.columnId;
        if (req.query.assigneeId) filter.assigneeId = req.query.assigneeId;
        if (req.query.workspaceId) filter.workspaceId = req.query.workspaceId;

        const tasks = await Task.find(filter)
            .populate('assigneeId', 'name avatar role')
            .populate('createdById', 'name avatar role')
            .sort({ createdAt: -1 });

        res.json({ tasks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET SINGLE TASK   (all roles)
// ─────────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigneeId', 'name avatar role')
            .populate('createdById', 'name avatar role');

        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ task });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// CREATE TASK   (Owner only — Admin must use /api/requests)
// ─────────────────────────────────────────────────────────
/**
 * POST /api/tasks
 * Only Owner can create tasks directly.
 * Admin must POST to /api/requests with type: 'ADD_TASK' instead.
 * Members & Viewers are blocked entirely.
 */
router.post('/', protect, requireOwner, async (req, res) => {
    try {
        const {
            title, description, columnId, projectId, workspaceId,
            assigneeId, tag, priority, dueDate, subtasks
        } = req.body;

        if (!title) return res.status(400).json({ error: 'Title is required' });

        const task = new Task({
            title,
            description: description || '',
            columnId: columnId || 'backlog',
            projectId: projectId || null,
            workspaceId: workspaceId || null,
            assigneeId: assigneeId || null,
            createdById: req.user._id,
            tag: tag || 'General',
            priority: priority || 'medium',
            dueDate: dueDate || null,
            subtasks: subtasks || [],
            activity: [{
                id: 'act-' + Date.now(),
                userId: req.user._id,
                text: 'created this task (Owner direct action)',
                time: new Date().toISOString()
            }]
        });

        const saved = await task.save();
        res.status(201).json({ task: saved });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// UPDATE TASK   (Owner can update anything; Admin can update fields except columnId/delete)
// ─────────────────────────────────────────────────────────
/**
 * PUT /api/tasks/:id
 * Owner: can update any field including columnId (move task directly).
 * Admin: can update title/description/priority/tag/dueDate/assigneeId.
 *        If Admin tries to change columnId (move), they must use /api/requests with MOVE_TASK.
 * Member/Viewer: BLOCKED.
 */
router.put('/:id', protect, blockReadOnly, async (req, res) => {
    try {
        const role = req.user.role;
        const updates = { ...req.body };

        // Admin cannot directly move tasks (change columnId)
        if (role === 'admin' && updates.columnId !== undefined) {
            return res.status(403).json({
                error: 'Admin cannot move tasks directly. Please submit a Move Request for Owner approval.'
            });
        }

        // Log activity
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const changedFields = Object.keys(updates).filter(k => updates[k] !== task[k]);
        if (changedFields.length > 0) {
            task.activity = task.activity || [];
            task.activity.unshift({
                id: 'act-' + Date.now(),
                userId: req.user._id,
                text: `updated ${changedFields.join(', ')}`,
                time: new Date().toISOString()
            });
        }

        Object.assign(task, updates);
        const saved = await task.save();
        res.json({ task: saved });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// DELETE TASK   (Owner only — Admin must use /api/requests)
// ─────────────────────────────────────────────────────────
/**
 * DELETE /api/tasks/:id
 * Only Owner can delete tasks directly.
 * Admin must submit a DELETE_TASK request via /api/requests.
 * Members & Viewers are blocked entirely.
 */
router.delete('/:id', protect, requireOwner, async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully by Owner', taskId: req.params.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// ADD COMMENT   (Owner + Admin + Member can comment; Viewer cannot)
// ─────────────────────────────────────────────────────────
router.post('/:id/comments', protect, async (req, res) => {
    try {
        const role = req.user.role;
        if (role === 'viewer') {
            return res.status(403).json({ error: 'Viewers cannot add comments.' });
        }

        const { text } = req.body;
        if (!text?.trim()) return res.status(400).json({ error: 'Comment text is required' });

        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        task.comments.push({
            id: 'cmt-' + Date.now(),
            userId: req.user._id,
            text: text.trim(),
            createdAt: new Date()
        });

        task.activity.unshift({
            id: 'act-' + Date.now(),
            userId: req.user._id,
            text: 'added a comment',
            time: new Date().toISOString()
        });

        const saved = await task.save();
        res.status(201).json({ task: saved });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;