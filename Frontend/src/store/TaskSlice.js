import { createSlice } from '@reduxjs/toolkit';
import { initialTasks } from './initialData';

const savedTasks = localStorage.getItem('wm_tasks');
const savedRequests = localStorage.getItem('wm_pending_requests');

const initialState = {
    tasks: savedTasks ? JSON.parse(savedTasks) : initialTasks,
    selectedTaskIds: [], // For bulk actions
    activeDetailTaskId: null, // For expanded task detail modal
    history: [], // Stack for undo actions: { actionType, payload, previousState }
    future: [],  // Stack for redo actions
    pendingRequests: savedRequests ? JSON.parse(savedRequests) : [] // For Admin task add/delete approvals
};

const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {
        addTask: (state, action) => {
            const newTask = {
                id: 't-' + Date.now(),
                projectId: action.payload.projectId,
                columnId: action.payload.columnId || 'backlog',
                title: action.payload.title,
                description: action.payload.description || '',
                tag: action.payload.tag || 'General',
                priority: action.payload.priority || 'medium',
                dueDate: action.payload.dueDate || new Date().toISOString().split('T')[0],
                assigneeId: action.payload.assigneeId || 'u-1',
                completed: false,
                subtasks: action.payload.subtasks || [],
                attachments: action.payload.attachments || [],
                comments: [],
                activity: [
                    {
                        id: 'act-' + Date.now(),
                        userId: action.payload.actingUserId || 'u-1',
                        text: 'created this task',
                        time: 'Just now'
                    }
                ]
            };

            // Save to undo history
            state.history.push({ type: 'ADD_TASK', taskId: newTask.id });
            state.future = [];
            state.tasks.unshift(newTask);
        },
        updateTask: (state, action) => {
            const { id, updates, actingUserId } = action.payload;
            const task = state.tasks.find(t => t.id === id);
            if (task) {
                // Track changes in undo history
                const prev = { ...task };
                state.history.push({ type: 'UPDATE_TASK', taskId: id, previousData: prev });
                state.future = [];

                Object.assign(task, updates);

                if (updates.columnId && updates.columnId !== prev.columnId) {
                    task.activity.unshift({
                        id: 'act-' + Date.now(),
                        userId: actingUserId || 'u-1',
                        text: `moved task to ${updates.columnId}`,
                        time: 'Just now'
                    });
                }
            }
        },
        deleteTask: (state, action) => {
            const taskToDelete = state.tasks.find(t => t.id === action.payload.id);
            if (taskToDelete) {
                state.history.push({ type: 'DELETE_TASK', task: { ...taskToDelete } });
                state.future = [];
                state.tasks = state.tasks.filter(t => t.id !== action.payload.id);
                if (state.activeDetailTaskId === action.payload.id) {
                    state.activeDetailTaskId = null;
                }
            }
        },
        duplicateTask: (state, action) => {
            const task = state.tasks.find(t => t.id === action.payload);
            if (task) {
                const cloned = {
                    ...task,
                    id: 't-' + Date.now(),
                    title: `${task.title} (Copy)`,
                    activity: [{ id: 'act-' + Date.now(), userId: 'u-1', text: 'duplicated task', time: 'Just now' }]
                };
                state.tasks.unshift(cloned);
            }
        },
        // Nested Subtask Management
        addSubtask: (state, action) => {
            const { taskId, title } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const newSubtask = {
                    id: 'st-' + Date.now(),
                    title,
                    completed: false
                };
                task.subtasks.push(newSubtask);
                task.activity.unshift({
                    id: 'act-' + Date.now(),
                    userId: action.payload.actingUserId || 'u-1',
                    text: `added subtask "${title}"`,
                    time: 'Just now'
                });
            }
        },
        toggleSubtask: (state, action) => {
            const { taskId, subtaskId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const sub = task.subtasks.find(s => s.id === subtaskId);
                if (sub) {
                    sub.completed = !sub.completed;
                }
            }
        },
        deleteSubtask: (state, action) => {
            const { taskId, subtaskId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
            }
        },
        convertSubtaskToTask: (state, action) => {
            const { taskId, subtaskId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const sub = task.subtasks.find(s => s.id === subtaskId);
                if (sub) {
                    const newTask = {
                        id: 't-' + Date.now(),
                        projectId: task.projectId,
                        columnId: task.columnId,
                        title: sub.title,
                        description: `Converted from subtask of "${task.title}"`,
                        tag: task.tag,
                        priority: task.priority,
                        dueDate: task.dueDate,
                        assigneeId: task.assigneeId,
                        completed: sub.completed,
                        subtasks: [],
                        attachments: [],
                        comments: [],
                        activity: [{ id: 'act-' + Date.now(), userId: 'u-1', text: 'converted from subtask', time: 'Just now' }]
                    };
                    task.subtasks = task.subtasks.filter(s => s.id !== subtaskId);
                    state.tasks.unshift(newTask);
                }
            }
        },
        convertTaskToSubtask: (state, action) => {
            const { parentTaskId, targetTaskId } = action.payload;
            const parent = state.tasks.find(t => t.id === parentTaskId);
            const target = state.tasks.find(t => t.id === targetTaskId);
            if (parent && target) {
                parent.subtasks.push({
                    id: 'st-' + Date.now(),
                    title: target.title,
                    completed: target.completed
                });
                state.tasks = state.tasks.filter(t => t.id !== targetTaskId);
            }
        },
        // Attachments (base64 client blob)
        addAttachment: (state, action) => {
            const { taskId, file } = action.payload; // { name, size, dataUrl }
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.attachments.push({
                    id: 'att-' + Date.now(),
                    ...file,
                    uploadedAt: new Date().toISOString()
                });
            }
        },
        removeAttachment: (state, action) => {
            const { taskId, attachmentId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.attachments = task.attachments.filter(a => a.id !== attachmentId);
            }
        },
        // Comments & @mentions
        addComment: (state, action) => {
            const { taskId, text, user } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const newComment = {
                    id: 'c-' + Date.now(),
                    userId: user.id,
                    userName: user.name,
                    avatar: user.avatar,
                    text,
                    createdAt: new Date().toISOString()
                };
                task.comments.push(newComment);
                task.activity.unshift({
                    id: 'act-' + Date.now(),
                    userId: user.id,
                    text: 'commented on this task',
                    time: 'Just now'
                });
            }
        },
        editComment: (state, action) => {
            const { taskId, commentId, text } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                const comment = task.comments.find(c => c.id === commentId);
                if (comment) {
                    comment.text = text;
                    comment.updatedAt = new Date().toISOString();
                }
            }
        },
        deleteComment: (state, action) => {
            const { taskId, commentId } = action.payload;
            const task = state.tasks.find(t => t.id === taskId);
            if (task) {
                task.comments = task.comments.filter(c => c.id !== commentId);
            }
        },
        // Bulk Actions
        toggleTaskSelection: (state, action) => {
            const id = action.payload;
            if (state.selectedTaskIds.includes(id)) {
                state.selectedTaskIds = state.selectedTaskIds.filter(tid => tid !== id);
            } else {
                state.selectedTaskIds.push(id);
            }
        },
        selectAllTasks: (state, action) => {
            state.selectedTaskIds = action.payload; // array of ids
        },
        clearSelectedTasks: (state) => {
            state.selectedTaskIds = [];
        },
        bulkUpdateStatus: (state, action) => {
            const { targetColumnId } = action.payload;
            state.tasks.forEach(t => {
                if (state.selectedTaskIds.includes(t.id)) {
                    t.columnId = targetColumnId;
                }
            });
            state.selectedTaskIds = [];
        },
        bulkUpdateAssignee: (state, action) => {
            const { assigneeId } = action.payload;
            state.tasks.forEach(t => {
                if (state.selectedTaskIds.includes(t.id)) {
                    t.assigneeId = assigneeId;
                }
            });
            state.selectedTaskIds = [];
        },
        bulkDeleteTasks: (state) => {
            state.tasks = state.tasks.filter(t => !state.selectedTaskIds.includes(t.id));
            state.selectedTaskIds = [];
        },
        // Detail Modal
        setActiveDetailTask: (state, action) => {
            state.activeDetailTaskId = action.payload;
        },
        // Undo / Redo Actions
        undoLastAction: (state) => {
            const lastAction = state.history.pop();
            if (!lastAction) return;

            if (lastAction.type === 'DELETE_TASK') {
                state.tasks.push(lastAction.task);
                state.future.push({ type: 'RESTORED_TASK', taskId: lastAction.task.id });
            } else if (lastAction.type === 'UPDATE_TASK') {
                const task = state.tasks.find(t => t.id === lastAction.taskId);
                if (task) {
                    const currentData = { ...task };
                    Object.assign(task, lastAction.previousData);
                    state.future.push({ type: 'REVERT_UPDATE', taskId: task.id, nextData: currentData });
                }
            } else if (lastAction.type === 'ADD_TASK') {
                const added = state.tasks.find(t => t.id === lastAction.taskId);
                if (added) {
                    state.future.push({ type: 'RE_ADD_TASK', task: added });
                    state.tasks = state.tasks.filter(t => t.id !== lastAction.taskId);
                }
            }
        },
        importTasksData: (state, action) => {
            if (action.payload) {
                state.tasks = action.payload;
            }
        },
        createTaskRequest: (state, action) => {
            const { id, type, data, requestedBy } = action.payload;
            state.pendingRequests.unshift({
                id: id || 'req-' + Date.now(),
                type, // 'ADD_TASK' | 'DELETE_TASK' | 'BULK_DELETE_TASK' | 'MOVE_TASK'
                data,
                requestedBy, // { id, name, role }
                status: 'pending',
                createdAt: new Date().toISOString()
            });
        },
        approveTaskRequest: (state, action) => {
            const { requestId } = action.payload;
            const req = state.pendingRequests.find(r => r.id === requestId);
            if (!req || req.status !== 'pending') return;

            req.status = 'approved';

            if (req.type === 'ADD_TASK') {
                const newTask = {
                    id: 't-' + Date.now(),
                    projectId: req.data.projectId,
                    columnId: req.data.columnId || 'backlog',
                    title: req.data.title,
                    description: req.data.description || '',
                    tag: req.data.tag || 'General',
                    priority: req.data.priority || 'medium',
                    dueDate: req.data.dueDate || new Date().toISOString().split('T')[0],
                    assigneeId: req.data.assigneeId || req.requestedBy?.id || 'u-1',
                    completed: false,
                    subtasks: req.data.subtasks || [],
                    attachments: req.data.attachments || [],
                    comments: [],
                    activity: [
                        {
                            id: 'act-' + Date.now(),
                            userId: req.requestedBy?.id || 'u-2',
                            text: `created task (Approved by Owner)`,
                            time: 'Just now'
                        }
                    ]
                };
                state.tasks.unshift(newTask);
                state.history.push({ type: 'ADD_TASK', taskId: newTask.id });
            } else if (req.type === 'DELETE_TASK') {
                const taskToDelete = state.tasks.find(t => t.id === req.data.id);
                if (taskToDelete) {
                    state.history.push({ type: 'DELETE_TASK', task: { ...taskToDelete } });
                    state.tasks = state.tasks.filter(t => t.id !== req.data.id);
                    if (state.activeDetailTaskId === req.data.id) {
                        state.activeDetailTaskId = null;
                    }
                }
            } else if (req.type === 'BULK_DELETE_TASK') {
                const ids = req.data.ids || [];
                const tasksToDelete = state.tasks.filter(t => ids.includes(t.id));
                state.history.push({ type: 'BULK_DELETE_TASKS', tasks: tasksToDelete });
                state.tasks = state.tasks.filter(t => !ids.includes(t.id));
                state.selectedTaskIds = [];
                if (ids.includes(state.activeDetailTaskId)) {
                    state.activeDetailTaskId = null;
                }
            } else if (req.type === 'MOVE_TASK') {
                const task = state.tasks.find(t => t.id === req.data.taskId);
                if (task) {
                    const prevColId = task.columnId;
                    task.columnId = req.data.targetColumnId;
                    state.history.push({ type: 'MOVE_TASK', taskId: task.id, previousColumnId: prevColId });
                    task.activity = task.activity || [];
                    task.activity.unshift({
                        id: 'act-' + Date.now(),
                        userId: req.requestedBy?.id || 'u-2',
                        text: `moved task to ${req.data.targetColumnId} (Approved by Owner)`,
                        time: 'Just now'
                    });
                }
            }
        },
        rejectTaskRequest: (state, action) => {
            const { requestId } = action.payload;
            const req = state.pendingRequests.find(r => r.id === requestId);
            if (req && req.status === 'pending') {
                req.status = 'rejected';
            }
        }
    }
});

export const {
    addTask,
    updateTask,
    deleteTask,
    duplicateTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    convertSubtaskToTask,
    convertTaskToSubtask,
    addAttachment,
    removeAttachment,
    addComment,
    editComment,
    deleteComment,
    toggleTaskSelection,
    selectAllTasks,
    clearSelectedTasks,
    bulkUpdateStatus,
    bulkUpdateAssignee,
    bulkDeleteTasks,
    setActiveDetailTask,
    undoLastAction,
    importTasksData,
    createTaskRequest,
    approveTaskRequest,
    rejectTaskRequest
} = taskSlice.actions;

export default taskSlice.reducer;
