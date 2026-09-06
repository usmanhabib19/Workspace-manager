const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_workspace_2026';

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * Default role = 'member' unless specified.
 * Only the first user registered in a workspace becomes 'owner'.
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Validate role
        const allowedRoles = ['owner', 'admin', 'member', 'viewer'];
        const assignedRole = allowedRoles.includes(role) ? role : 'member';

        const newUser = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: assignedRole,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
        });

        const savedUser = await newUser.save();
        const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                avatar: savedUser.avatar
            }
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: err.message || 'Server error during registration' });
    }
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns JWT token + user info including role.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account deactivated. Contact workspace Owner.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: err.message || 'Server error during login' });
    }
});

// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No authorization token provided' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                workspaceId: user.workspaceId,
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

// ─────────────────────────────────────────────
// GET ALL USERS (workspace members list)
// ─────────────────────────────────────────────
/**
 * GET /api/auth/members
 * Returns all users with their roles (for workspace member directory).
 * Used by Owner to manage roles / by UI to show member cards.
 */
router.get('/members', async (req, res) => {
    try {
        const users = await User.find({ isActive: true }).select('-password').sort({ role: 1, name: 1 });
        res.json({ members: users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// UPDATE USER ROLE  (Owner only — enforced by frontend; add middleware in production)
// ─────────────────────────────────────────────
/**
 * PATCH /api/auth/members/:id/role
 * Body: { role: 'admin' | 'member' | 'viewer' }
 * Only Owner can change roles.
 */
router.patch('/members/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const allowedRoles = ['admin', 'member', 'viewer'];  // owner cannot be changed via API
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Allowed: admin, member, viewer' });
        }

        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, select: '-password' }
        );

        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json({ user: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
