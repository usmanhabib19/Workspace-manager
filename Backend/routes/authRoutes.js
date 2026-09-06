const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_workspace_2026';

// Global Owner Email from .env
const getOwnerEmail = () => (process.env.OWNER_EMAIL || 'mu801710@gmail.com').trim().toLowerCase();

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
/**
 * POST /api/auth/register
 * Body: { name, email, password }
 * ONLY the email specified in OWNER_EMAIL from .env is granted the global 'owner' role.
 * Every other user who registers will strictly receive the 'member' role.
 */
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check if this is the designated global website Owner from .env
        const isGlobalOwner = normalizedEmail === getOwnerEmail();
        const assignedRole = isGlobalOwner ? 'owner' : 'member';

        const newUser = new User({
            name,
            email: normalizedEmail,
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
 * Verifies password and ensures role integrity (only .env email has 'owner' role).
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please provide both email and password' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });
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

        // Ensure role consistency with .env OWNER_EMAIL
        const isGlobalOwner = normalizedEmail === getOwnerEmail();
        if (isGlobalOwner && user.role !== 'owner') {
            user.role = 'owner';
            await user.save();
        } else if (!isGlobalOwner && user.role === 'owner') {
            // Prevent non-env user from holding global owner status
            user.role = 'member';
            await user.save();
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
router.get('/members', async (req, res) => {
    try {
        const users = await User.find({ isActive: true }).select('-password').sort({ role: 1, name: 1 });
        res.json({ members: users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────────
// UPDATE USER ROLE (Admin / Member / Viewer only — Owner role cannot be assigned via API)
// ─────────────────────────────────────────────
router.patch('/members/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const allowedRoles = ['admin', 'member', 'viewer']; // Owner role is strictly reserved for .env email
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Website Owner is fixed via .env. Allowed roles: admin, member, viewer' });
        }

        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        if (targetUser.email.toLowerCase() === getOwnerEmail()) {
            return res.status(400).json({ error: 'Cannot change the role of the global website Owner.' });
        }

        targetUser.role = role;
        await targetUser.save();

        res.json({ user: targetUser });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
