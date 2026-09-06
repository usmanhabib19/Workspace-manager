const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL || 'mu801710@gmail.com';

export const initialUsers = [
    {
        id: 'u-1',
        name: 'Muhammad Usman (Owner)',
        email: OWNER_EMAIL,
        role: 'owner',
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Muhammad%20Usman`
    }
];

export const initialWorkspaces = [
    {
        id: 'ws-1',
        name: 'Kinetic Workspace',
        color: '#0D9488',
        icon: 'folder',
        defaultView: 'kanban',
        members: [
            { userId: 'u-1', role: 'owner' },
            { userId: 'u-2', role: 'admin' },
            { userId: 'u-3', role: 'member' },
            { userId: 'u-4', role: 'viewer' }
        ]
    },
    {
        id: 'ws-2',
        name: 'Design Studio',
        color: '#6366F1',
        icon: 'palette',
        defaultView: 'list',
        members: [
            { userId: 'u-1', role: 'owner' },
            { userId: 'u-2', role: 'member' }
        ]
    }
];

export const initialProjects = [
    {
        id: 'proj-1',
        workspaceId: 'ws-1',
        name: 'Sprint 34',
        description: 'Core product sprint focusing on Notion-style handles and command palette.',
        color: '#0D9488',
        icon: 'folder-kanban',
        isArchived: false,
        members: ['u-1', 'u-2', 'u-3', 'u-4'],
        columns: [
            { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700' },
            { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 text-blue-700' },
            { id: 'review', title: 'In Review / QA', color: 'bg-amber-50 text-amber-700' },
            { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-700' }
        ]
    },
    {
        id: 'proj-2',
        workspaceId: 'ws-1',
        name: 'Product Roadmap',
        description: 'Q3 and Q4 strategic milestone initiatives and feature rollouts.',
        color: '#2563EB',
        icon: 'map',
        isArchived: false,
        members: ['u-1', 'u-2'],
        columns: [
            { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 text-gray-700' },
            { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 text-blue-700' },
            { id: 'review', title: 'In Review / QA', color: 'bg-amber-50 text-amber-700' },
            { id: 'completed', title: 'Completed', color: 'bg-emerald-50 text-emerald-700' }
        ]
    }
];

export const initialTasks = [
    {
        id: 't-1',
        projectId: 'proj-1',
        columnId: 'backlog',
        title: 'Omnibar command palette redesign (Cmd+K)',
        description: 'Implement a Notion-style quick launcher with keyboard navigation, fuzzy search, and action triggers.',
        tag: 'UX Utility',
        priority: 'high',
        dueDate: '2026-09-12',
        assigneeId: 'u-1',
        completed: false,
        subtasks: [
            { id: 'st-1', title: 'Add keydown listener for Cmd+K / Ctrl+K', completed: true },
            { id: 'st-2', title: 'Support fuzzy filter over projects and tasks', completed: false },
            { id: 'st-3', title: 'Add quick action jump handlers', completed: false }
        ],
        attachments: [],
        comments: [
            {
                id: 'c-1',
                userId: 'u-2',
                userName: 'Sara Khan',
                avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sara%20Khan',
                text: 'Make sure we include @Ali Raza in the review process!',
                createdAt: new Date(Date.now() - 3600000).toISOString()
            }
        ],
        activity: [
            { id: 'act-1', userId: 'u-1', text: 'created this task', time: '2 hours ago' }
        ]
    },
    {
        id: 't-2',
        projectId: 'proj-1',
        columnId: 'in-progress',
        title: 'Interactive drag-and-drop Kanban lane reordering',
        description: 'Allow smooth reordering of cards across swimlanes with optimistic UI updates and instant undo toast.',
        tag: 'Core Experience',
        priority: 'urgent',
        dueDate: '2026-09-08',
        assigneeId: 'u-3',
        completed: false,
        subtasks: [
            { id: 'st-4', title: 'Handle dragEnter and dragLeave states', completed: true },
            { id: 'st-5', title: 'Add ghost placeholder indicator', completed: true },
            { id: 'st-6', title: 'Save column state to local persistence', completed: true }
        ],
        attachments: [],
        comments: [],
        activity: [
            { id: 'act-2', userId: 'u-3', text: 'moved to In Progress', time: '1 hour ago' }
        ]
    },
    {
        id: 't-3',
        projectId: 'proj-1',
        columnId: 'review',
        title: 'Dark / Light mode design system token audit',
        description: 'Verify HSL color variables across all cards, modals, and navigation components for clean contrast.',
        tag: 'Design System',
        priority: 'medium',
        dueDate: '2026-09-15',
        assigneeId: 'u-2',
        completed: false,
        subtasks: [
            { id: 'st-7', title: 'Audit tailwind color tokens', completed: true },
            { id: 'st-8', title: 'Test dark theme background contrast', completed: true }
        ],
        attachments: [],
        comments: [],
        activity: [
            { id: 'act-3', userId: 'u-2', text: 'moved to In Review / QA', time: '30 mins ago' }
        ]
    },
    {
        id: 't-4',
        projectId: 'proj-1',
        columnId: 'completed',
        title: 'Export and Import workspace as JSON backup',
        description: 'Enable one-click full backup download and restore with schema validation and confirmation dialogs.',
        tag: 'Persistence',
        priority: 'low',
        dueDate: '2026-09-05',
        assigneeId: 'u-1',
        completed: true,
        subtasks: [
            { id: 'st-9', title: 'Write JSON serializer', completed: true },
            { id: 'st-10', title: 'Validate schema on file upload', completed: true }
        ],
        attachments: [],
        comments: [],
        activity: [
            { id: 'act-4', userId: 'u-1', text: 'marked task completed', time: '1 day ago' }
        ]
    }
];

export const initialNotifications = [
    {
        id: 'notif-1',
        title: 'Assigned to new task',
        message: 'Sara Khan assigned you to "Dark / Light mode design system token audit"',
        time: '15m ago',
        isRead: false,
        type: 'assigned'
    },
    {
        id: 'notif-2',
        title: 'Mentioned in comment',
        message: 'Sara Khan mentioned you in "Omnibar command palette redesign"',
        time: '1h ago',
        isRead: false,
        type: 'mention'
    },
    {
        id: 'notif-3',
        title: 'Due date approaching',
        message: 'Task "Interactive drag-and-drop Kanban lane" is due tomorrow',
        time: '3h ago',
        isRead: true,
        type: 'due'
    }
];
