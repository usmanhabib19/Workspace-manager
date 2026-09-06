import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleTaskSelection, selectAllTasks, clearSelectedTasks, setActiveDetailTask, updateTask } from '../../store/TaskSlice';
import { setGroupBy, setSortBy } from '../../store/UiSlice';
import {
    ChevronDown, ChevronRight, CheckSquare, Square, ArrowUpDown,
    Layers, User, Flag, Calendar, Tag, CheckCircle2
} from 'lucide-react';

export default function ListView() {
    const projects = useSelector((state) => state.workspaces.projects);
    const activeProjectId = useSelector((state) => state.workspaces.activeProjectId);
    const currentProject = projects.find(p => p.id === activeProjectId);
    const tasks = useSelector((state) => state.tasks.tasks);
    const selectedTaskIds = useSelector((state) => state.tasks.selectedTaskIds);
    const users = useSelector((state) => state.auth.users);
    const currentUser = useSelector((state) => state.auth.currentUser);
    const filters = useSelector((state) => state.ui.filters);
    const searchQuery = useSelector((state) => state.ui.searchQuery);
    const groupBy = useSelector((state) => state.ui.groupBy); // 'status', 'priority', 'assignee', 'tag'
    const sortBy = useSelector((state) => state.ui.sortBy); // 'dueDate', 'priority', 'title'

    const dispatch = useDispatch();
    const [collapsedGroups, setCollapsedGroups] = useState({});

    const toggleGroup = (groupKey) => {
        setCollapsedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const isViewer = currentUser?.role === 'viewer';

    const projectTasks = tasks.filter(t => t.projectId === activeProjectId);

    // Filter
    let filtered = projectTasks.filter(task => {
        if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.tag.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (filters.assignee !== 'all' && task.assigneeId !== filters.assignee) return false;
        if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
        if (filters.status !== 'all' && task.columnId !== filters.status) return false;
        if (filters.tag !== 'all' && task.tag !== filters.tag) return false;
        return true;
    });

    // Sort
    filtered.sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate);
        if (sortBy === 'priority') {
            const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
            return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        return 0;
    });

    // Grouping
    const groups = {};
    if (groupBy === 'status') {
        currentProject?.columns?.forEach(col => { groups[col.title] = []; });
        filtered.forEach(t => {
            const col = currentProject?.columns?.find(c => c.id === t.columnId);
            const key = col ? col.title : t.columnId;
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
    } else if (groupBy === 'priority') {
        ['urgent', 'high', 'medium', 'low'].forEach(p => { groups[p.toUpperCase()] = []; });
        filtered.forEach(t => {
            const key = t.priority.toUpperCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
    } else if (groupBy === 'assignee') {
        users.forEach(u => { groups[u.name] = []; });
        filtered.forEach(t => {
            const u = users.find(usr => usr.id === t.assigneeId);
            const key = u ? u.name : 'Unassigned';
            if (!groups[key]) groups[key] = [];
            groups[key].push(t);
        });
    } else {
        // Flat list
        groups['All Tasks'] = filtered;
    }

    const allFilteredIds = filtered.map(t => t.id);
    const isAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedTaskIds.includes(id));

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden font-sans">
            
            {/* Table Toolbar */}
            <div className="px-6 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-neutral-50/50 dark:bg-gray-950/40 text-xs">
                <div className="flex items-center space-x-3">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                        <Layers size={13} />
                        <span>Group by:</span>
                    </span>
                    <select
                        value={groupBy}
                        onChange={(e) => dispatch(setGroupBy(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                    >
                        <option value="status">Status</option>
                        <option value="priority">Priority</option>
                        <option value="assignee">Assignee</option>
                        <option value="none">None (Flat list)</option>
                    </select>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-semibold uppercase tracking-wider text-[11px] flex items-center space-x-1">
                        <ArrowUpDown size={13} />
                        <span>Sort:</span>
                    </span>
                    <select
                        value={sortBy}
                        onChange={(e) => dispatch(setSortBy(e.target.value))}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-800 dark:text-gray-200 font-medium focus:outline-none"
                    >
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="title">Title (Alphabetical)</option>
                    </select>
                </div>
            </div>

            {/* List Table Content */}
            <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 bg-neutral-50/70 dark:bg-gray-950/70 text-gray-400 uppercase tracking-wider text-[10px]">
                            <th className="py-2.5 px-4 w-10 text-center">
                                <input
                                    type="checkbox"
                                    checked={isAllSelected}
                                    onChange={() => {
                                        if (isAllSelected) dispatch(clearSelectedTasks());
                                        else dispatch(selectAllTasks(allFilteredIds));
                                    }}
                                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                />
                            </th>
                            <th className="py-2.5 px-4 font-semibold">Task Title</th>
                            <th className="py-2.5 px-4 font-semibold w-28">Status</th>
                            <th className="py-2.5 px-4 font-semibold w-24">Priority</th>
                            <th className="py-2.5 px-4 font-semibold w-32">Assignee</th>
                            <th className="py-2.5 px-4 font-semibold w-28">Due Date</th>
                            <th className="py-2.5 px-4 font-semibold w-24 text-center">Subtasks</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                        {Object.entries(groups).map(([groupTitle, groupTasks]) => {
                            const isCollapsed = collapsedGroups[groupTitle];

                            return (
                                <React.Fragment key={groupTitle}>
                                    {/* Group Header Row */}
                                    <tr
                                        onClick={() => toggleGroup(groupTitle)}
                                        className="bg-neutral-100/60 dark:bg-gray-800/40 hover:bg-neutral-100 dark:hover:bg-gray-800 font-semibold cursor-pointer select-none text-gray-700 dark:text-gray-300"
                                    >
                                        <td colSpan={7} className="py-2 px-4">
                                            <div className="flex items-center space-x-2">
                                                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                                <span>{groupTitle}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">
                                                    ({groupTasks.length})
                                                </span>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Group Tasks Rows */}
                                    {!isCollapsed && groupTasks.map(task => {
                                        const isSelected = selectedTaskIds.includes(task.id);
                                        const assignee = users.find(u => u.id === task.assigneeId);
                                        const subtasksDone = task.subtasks?.filter(s => s.completed).length || 0;
                                        const subtasksTotal = task.subtasks?.length || 0;

                                        return (
                                            <tr
                                                key={task.id}
                                                onClick={() => dispatch(setActiveDetailTask(task.id))}
                                                className={`hover:bg-teal-50/40 dark:hover:bg-teal-950/20 cursor-pointer transition-colors ${
                                                    isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
                                                }`}
                                            >
                                                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => dispatch(toggleTaskSelection(task.id))}
                                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                                                    />
                                                </td>

                                                {/* Title */}
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <span className="truncate">{task.title}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-gray-800 text-gray-500 shrink-0">
                                                            {task.tag}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-4">
                                                    <span className="text-[11px] px-2 py-0.5 rounded font-medium bg-neutral-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                        {task.columnId}
                                                    </span>
                                                </td>

                                                {/* Priority */}
                                                <td className="py-3 px-4">
                                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                                        task.priority === 'urgent' ? 'text-red-600 bg-red-50 dark:bg-red-950/50' :
                                                        task.priority === 'high' ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/50' :
                                                        'text-gray-500 bg-gray-50 dark:bg-gray-800'
                                                    }`}>
                                                        {task.priority}
                                                    </span>
                                                </td>

                                                {/* Assignee */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-2 truncate">
                                                        <img
                                                            src={assignee?.avatar}
                                                            alt={assignee?.name}
                                                            className="h-5 w-5 rounded-full border border-gray-200 shrink-0"
                                                        />
                                                        <span className="text-gray-700 dark:text-gray-300 truncate">{assignee?.name}</span>
                                                    </div>
                                                </td>

                                                {/* Due Date */}
                                                <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                                                    {task.dueDate}
                                                </td>

                                                {/* Subtasks */}
                                                <td className="py-3 px-4 text-center text-gray-400">
                                                    {subtasksTotal > 0 ? (
                                                        <span className="text-[11px] px-1.5 py-0.5 bg-neutral-100 dark:bg-gray-800 rounded font-medium">
                                                            {subtasksDone}/{subtasksTotal}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
