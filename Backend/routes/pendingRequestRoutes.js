const express = require('express');
const router = express.Router();
const PendingRequest = require('../models/PendingRequest');
const Task = require('../models/Task');
const { protect, requireOwner, requireAdmin } = require('../middleware/authMiddleware');

// ─────────────────────────────────────────────────────────
// CREATE REQUEST   (Admin only — Owner doesn't need approval)
// ─────────────────────────────────────────────────────────
/**
 * POST /api/requests
 * Admin submits an action request to the Owner for approval.
 *
 * Body examples:
 *
 *  ADD_TASK:
 *    { type: 'ADD_TASK', data: { projectId, columnId, title, priority, description } }
 *
 *  DELETE_TASK:
 *    { type: 'DELETE_TASK', data: { id: taskId, title: taskTitle } }
 *
 *  BULK_DELETE_TASK:
 *    { type: 'BULK_DELETE_TASK', data: { ids: [...], title: '3 selected tasks' } }
 *
 *  MOVE_TASK:
 *    { type: 'MOVE_TASK', data: { taskId, taskTitle, fromColumnId, fromColumnTitle, targetColumnId, targetColumnTitle } }
 *
 * Member/Viewer: BLOCKED — they have no write access at all, not even requests.
 */
router.post('/', protect, requireAdmin, async (req, res) => {
    try {
        const role = req.user.role;

        // Owner doesn't need to submit requests — they act directly
        if (role === 'owner') {
            return res.status(400).json({
                error: 'Owner can perform actions directly. No approval request needed.'
            });
        }

        const { type, data, workspaceId, projectId } = req.body;

        const allowedTypes = ['ADD_TASK', 'DELETE_TASK', 'BULK_DELETE_TASK', 'MOVE_TASK'];
        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ error: `Invalid request type. Allowed: ${allowedTypes.join(', ')}` });
        }

        if (!data) {
            return res.status(400).json({ error: 'Request data payload is required' });
        }

        const pendingRequest = new PendingRequest({
            type,
            data,
            requestedBy: req.user._id,
            requestedBySnapshot: {
                id: req.user._id.toString(),
                name: req.user.name,
                role: req.user.role,
                avatar: req.user.avatar
            },
            status: 'pending',
            workspaceId: workspaceId || null,
            projectId: projectId || null
        });

        const saved = await pendingRequest.save();
        res.status(201).json({ request: saved });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// GET ALL PENDING REQUESTS   (Owner sees all; Admin sees own)
// ─────────────────────────────────────────────────────────
/**
 * GET /api/requests
 * Owner: returns all pending requests for approval.
 * Admin: returns only their own requests (to check status).
 * Member/Viewer: BLOCKED.
 */
router.get('/', protect, requireAdmin, async (req, res) => {
    try {
        const filter = {};

        if (req.user.role === 'admin') {
            // Admin only sees their own
            filter.requestedBy = req.user._id;
        }

        if (req.query.status) filter.status = req.query.status;
        if (req.query.workspaceId) filter.workspaceId = req.query.workspaceId;

        const requests = await PendingRequest.find(filter)
            .populate('requestedBy', 'name avatar role')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// APPROVE REQUEST   (Owner only)
// ─────────────────────────────────────────────────────────
/**
 * POST /api/requests/:id/approve
 * Owner reviews and approves a pending request.
 * The corresponding action is then executed server-side:
 *   - ADD_TASK       → Task is created
 *   - DELETE_TASK    → Task is deleted
 *   - BULK_DELETE_TASK → Multiple tasks deleted
 *   - MOVE_TASK      → Task's columnId updated
 */
router.post('/:id/approve', protect, requireOwner, async (req, res) => {
    try {
        const pendingReq = await PendingRequest.findById(req.params.id);
        if (!pendingReq) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (pendingReq.status !== 'pending') {
            return res.status(400).json({ error: `Request already ${pendingReq.status}` });
        }

        // Execute the action
        let result = null;

        if (pendingReq.type === 'ADD_TASK') {
            const task = new Task({
                title: pendingReq.data.title,
                description: pendingReq.data.description || '',
                columnId: pendingReq.data.columnId || 'backlog',
                projectId: pendingReq.data.projectId || null,
                workspaceId: pendingReq.workspaceId,
                assigneeId: pendingReq.data.assigneeId || null,
                createdById: pendingReq.requestedBy,
                tag: pendingReq.data.tag || 'General',
                priority: pendingReq.data.priority || 'medium',
                activity: [{
                    id: 'act-' + Date.now(),
                    userId: pendingReq.requestedBy,
                    text: `created this task (approved by Owner ${req.user.name})`,
                    time: new Date().toISOString()
                }]
            });
            result = await task.save();

        } else if (pendingReq.type === 'DELETE_TASK') {
            result = await Task.findByIdAndDelete(pendingReq.data.id);
            if (!result) {
                return res.status(404).json({ error: 'Task to delete not found (already deleted?)' });
            }

        } else if (pendingReq.type === 'BULK_DELETE_TASK') {
            const ids = pendingReq.data.ids || [];
            const deleteResult = await Task.deleteMany({ _id: { $in: ids } });
            result = { deletedCount: deleteResult.deletedCount, ids };

        } else if (pendingReq.type === 'MOVE_TASK') {
            const task = await Task.findById(pendingReq.data.taskId);
            if (!task) {
                return res.status(404).json({ error: 'Task to move not found' });
            }
            task.columnId = pendingReq.data.targetColumnId;
            task.activity = task.activity || [];
            task.activity.unshift({
                id: 'act-' + Date.now(),
                userId: pendingReq.requestedBy,
                text: `moved task to ${pendingReq.data.targetColumnTitle} (approved by Owner ${req.user.name})`,
                time: new Date().toISOString()
            });
            result = await task.save();
        }

        // Mark request as approved
        pendingReq.status = 'approved';
        pendingReq.reviewedBy = req.user._id;
        pendingReq.reviewedAt = new Date();
        await pendingReq.save();

        res.json({
            message: `Request approved and action executed by Owner`,
            request: pendingReq,
            result
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────────────────
// REJECT REQUEST   (Owner only)
// ─────────────────────────────────────────────────────────
/**
 * POST /api/requests/:id/reject
 * Owner declines the request. No action is taken.
 */
router.post('/:id/reject', protect, requireOwner, async (req, res) => {
    try {
        const pendingReq = await PendingRequest.findById(req.params.id);
        if (!pendingReq) {
            return res.status(404).json({ error: 'Request not found' });
        }
        if (pendingReq.status !== 'pending') {
            return res.status(400).json({ error: `Request already ${pendingReq.status}` });
        }

        pendingReq.status = 'rejected';
        pendingReq.reviewedBy = req.user._id;
        pendingReq.reviewedAt = new Date();
        await pendingReq.save();

        res.json({ message: 'Request rejected by Owner', request: pendingReq });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
