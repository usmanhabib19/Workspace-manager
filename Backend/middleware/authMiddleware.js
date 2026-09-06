const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_workspace_2026';

/**
 * Middleware: Authenticate JWT
 * Attaches req.user = { id, role } if token is valid.
 */
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Not authorized. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'User not found or account deactivated.' });
        }

        req.user = user;  // full user document with .role
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

/**
 * Middleware: Require Owner role
 * Use after protect(). Blocks all non-owner roles.
 *
 * Usage:  router.delete('/:id', protect, requireOwner, handler);
 */
const requireOwner = (req, res, next) => {
    if (req.user?.role !== 'owner') {
        return res.status(403).json({
            error: 'Forbidden: Only the workspace Owner can perform this action directly.'
        });
    }
    next();
};

/**
 * Middleware: Require at least Admin role (owner or admin)
 * Members and Viewers are blocked.
 *
 * Usage:  router.post('/request', protect, requireAdmin, handler);
 */
const requireAdmin = (req, res, next) => {
    const role = req.user?.role;
    if (role !== 'owner' && role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden: Members and Viewers have read-only access. Only Owner or Admin can request this action.'
        });
    }
    next();
};

/**
 * Middleware: Block Member and Viewer from write actions
 * Used for task create/update/delete endpoints.
 *
 * ROLE PERMISSION TABLE:
 * ─────────────────────────────────────────────────────────────────
 *  Action                  Owner   Admin         Member   Viewer
 * ─────────────────────────────────────────────────────────────────
 *  View tasks              ✅      ✅            ✅       ✅
 *  Create task             ✅      ⚠️ (request)  ❌       ❌
 *  Delete task             ✅      ⚠️ (request)  ❌       ❌
 *  Move task (drag/drop)   ✅      ⚠️ (request)  ❌       ❌
 *  Update task fields      ✅      ✅            ❌       ❌
 *  Approve requests        ✅      ❌            ❌       ❌
 * ─────────────────────────────────────────────────────────────────
 */
const blockReadOnly = (req, res, next) => {
    const role = req.user?.role;
    if (role === 'member' || role === 'viewer') {
        return res.status(403).json({
            error: `Forbidden: ${role === 'viewer' ? 'Viewers' : 'Members'} have read-only access. Contact an Admin or Owner to make changes.`
        });
    }
    next();
};

module.exports = { protect, requireOwner, requireAdmin, blockReadOnly };
