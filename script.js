// Task Management System
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.customLists = this.loadCustomLists();
        this.currentList = 'inbox';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderTasks();
        this.updateListCounts();
        this.requestNotificationPermission();
        this.checkReminders();
        setInterval(() => this.checkReminders(), 60000); // Check reminders every minute
    }

    setupEventListeners() {
        // Add Task
        document.getElementById('addTaskBtn').addEventListener('click', () => this.createTask());
        document.getElementById('taskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createTask();
        });

        // List Navigation
        document.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentList = item.dataset.listId;
                this.renderTasks();
            });
        });

        // Filters and Sort
        document.getElementById('priorityFilter').addEventListener('change', () => this.renderTasks());
        document.getElementById('statusFilter').addEventListener('change', () => this.renderTasks());
        document.getElementById('sortBy').addEventListener('change', () => this.renderTasks());

        // Modal Controls
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('closeModalBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('saveTaslBtn').addEventListener('click', () => this.saveTask());
        document.getElementById('deletTaskBtn').addEventListener('click', () => this.deleteCurrentTask());

        // Add List Modal
        document.getElementById('addListBtn').addEventListener('click', () => this.openAddListModal());
        document.getElementById('createListBtn').addEventListener('click', () => this.createCustomList());
        document.getElementById('cancelListBtn').addEventListener('click', () => this.closeAddListModal());

        // Subtasks and Reminders
        document.getElementById('addSubtaskBtn').addEventListener('click', () => this.addSubtaskInput());
        document.getElementById('addReminderBtn').addEventListener('click', () => this.addReminderInput());
        document.getElementById('modalTaskRecurring').addEventListener('change', (e) => {
            document.getElementById('recurringOptions').classList.toggle('hidden', !e.target.checked);
        });
    }

    createTask() {
        const input = document.getElementById('taskInput');
        const title = input.value.trim();

        if (!title) {
            this.showNotification('Please enter a task title', 'error');
            return;
        }

        const task = {
            id: Date.now(),
            title,
            description: '',
            list: this.currentList,
            completed: false,
            priority: 'medium',
            dueDate: null,
            assignee: '',
            tags: [],
            subtasks: [],
            reminders: [],
            recurring: false,
            recurrenceType: 'daily',
            createdAt: new Date().toISOString(),
            attachments: []
        };

        this.tasks.push(task);
        this.saveTasks();
        input.value = '';
        this.renderTasks();
        this.updateListCounts();
        this.showNotification('Task created successfully!', 'success');
    }

    openTaskModal(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        window.currentTaskId = taskId;

        // Populate form
        document.getElementById('modalTaskTitle').value = task.title;
        document.getElementById('modalTaskDesc').value = task.description;
        document.getElementById('modalTaskDueDate').value = task.dueDate || '';
        document.getElementById('modalTaskPriority').value = task.priority;
        document.getElementById('modalTaskAssignee').value = task.assignee;
        document.getElementById('modalTaskTags').value = task.tags.join(', ');
        document.getElementById('modalTaskRecurring').checked = task.recurring;
        document.getElementById('modalTaskRecurrenceType').value = task.recurrenceType;

        // Populate lists dropdown
        const listSelect = document.getElementById('modalTaskList');
        listSelect.innerHTML = `
            <option value="inbox">Inbox</option>
            <option value="today">Today</option>
            <option value="upcoming">Upcoming</option>
            ${this.customLists.map(list => `<option value="${list.id}">${list.name}</option>`).join('')}
        `;
        listSelect.value = task.list;

        // Render subtasks
        document.getElementById('subtasksList').innerHTML = task.subtasks.map((subtask, idx) => `
            <div class="subtask-item">
                <input type="checkbox" ${subtask.completed ? 'checked' : ''} data-subtask-index="${idx}">
                <input type="text" class="form-input" value="${subtask.title}" data-subtask-index="${idx}">
                <button type="button" class="btn-remove" data-subtask-index="${idx}">Remove</button>
            </div>
        `).join('');

        // Add event listeners to subtask inputs
        document.querySelectorAll('#subtasksList .subtask-item input[type="text"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.subtaskIndex;
                task.subtasks[idx].title = e.target.value;
            });
        });

        document.querySelectorAll('#subtasksList .subtask-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const idx = e.target.dataset.subtaskIndex;
                task.subtasks[idx].completed = e.target.checked;
            });
        });

        document.querySelectorAll('#subtasksList .btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.subtaskIndex;
                task.subtasks.splice(idx, 1);
                this.openTaskModal(taskId); // Refresh modal
            });
        });

        // Render reminders
        document.getElementById('remindersList').innerHTML = task.reminders.map((reminder, idx) => `
            <div class="reminder-item">
                <select data-reminder-index="${idx}" class="form-input">
                    <option value="at-time" ${reminder.type === 'at-time' ? 'selected' : ''}>At Time</option>
                    <option value="before" ${reminder.type === 'before' ? 'selected' : ''}>Before</option>
                </select>
                <input type="text" class="form-input" value="${reminder.value}" placeholder="e.g., 2 hours" data-reminder-index="${idx}">
                <button type="button" class="btn-remove" data-reminder-index="${idx}">Remove</button>
            </div>
        `).join('');

        document.querySelectorAll('#remindersList .reminder-item select').forEach(select => {
            select.addEventListener('change', (e) => {
                const idx = e.target.dataset.reminderIndex;
                task.reminders[idx].type = e.target.value;
            });
        });

        document.querySelectorAll('#remindersList .reminder-item input[type="text"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const idx = e.target.dataset.reminderIndex;
                task.reminders[idx].value = e.target.value;
            });
        });

        document.querySelectorAll('#remindersList .btn-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = e.target.dataset.reminderIndex;
                task.reminders.splice(idx, 1);
                this.openTaskModal(taskId); // Refresh modal
            });
        });

        // Toggle recurring options
        document.getElementById('recurringOptions').classList.toggle('hidden', !task.recurring);

        document.getElementById('taskModal').classList.add('active');
    }

    addSubtaskInput() {
        const task = this.tasks.find(t => t.id === window.currentTaskId);
        if (!task) return;

        task.subtasks.push({ title: '', completed: false });
        this.openTaskModal(window.currentTaskId);
    }

    addReminderInput() {
        const task = this.tasks.find(t => t.id === window.currentTaskId);
        if (!task) return;

        task.reminders.push({ type: 'before', value: '1 hour' });
        this.openTaskModal(window.currentTaskId);
    }

    saveTask() {
        const task = this.tasks.find(t => t.id === window.currentTaskId);
        if (!task) return;

        task.title = document.getElementById('modalTaskTitle').value;
        task.description = document.getElementById('modalTaskDesc').value;
        task.dueDate = document.getElementById('modalTaskDueDate').value;
        task.priority = document.getElementById('modalTaskPriority').value;
        task.assignee = document.getElementById('modalTaskAssignee').value;
        task.tags = document.getElementById('modalTaskTags').value.split(',').map(t => t.trim()).filter(t => t);
        task.list = document.getElementById('modalTaskList').value;
        task.recurring = document.getElementById('modalTaskRecurring').checked;
        task.recurrenceType = document.getElementById('modalTaskRecurrenceType').value;

        this.saveTasks();
        this.closeModal();
        this.renderTasks();
        this.updateListCounts();
        this.updateTagsList();
        this.showNotification('Task updated successfully!', 'success');
    }

    deleteCurrentTask() {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.tasks = this.tasks.filter(t => t.id !== window.currentTaskId);
        this.saveTasks();
        this.closeModal();
        this.renderTasks();
        this.updateListCounts();
        this.showNotification('Task deleted successfully!', 'success');
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        task.completed = !task.completed;
        this.saveTasks();
        this.renderTasks();
        this.updateListCounts();

        if (task.recurring && task.completed) {
            setTimeout(() => {
                const newTask = { ...task, id: Date.now(), completed: false, createdAt: new Date().toISOString() };
                this.tasks.push(newTask);
                this.saveTasks();
                this.renderTasks();
            }, 1000);
        }
    }

    renderTasks() {
        const container = document.getElementById('tasksContainer');
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortBy').value;

        let filtered = this.tasks.filter(task => {
            // Filter by list
            if (this.currentList === 'today') {
                const today = new Date().toISOString().split('T')[0];
                if (task.dueDate !== today) return false;
            } else if (this.currentList === 'completed') {
                if (!task.completed) return false;
            } else if (this.currentList !== 'upcoming' && this.currentList !== 'inbox') {
                if (task.list !== this.currentList) return false;
            } else if (this.currentList === 'upcoming') {
                if (task.completed) return false;
                const today = new Date().toISOString().split('T')[0];
                if (!task.dueDate || task.dueDate <= today) return false;
            } else {
                if (task.list !== 'inbox' && task.list !== this.currentList) return false;
            }

            // Priority filter
            if (priorityFilter && task.priority !== priorityFilter) return false;

            // Status filter
            if (statusFilter === 'pending' && task.completed) return false;
            if (statusFilter === 'completed' && !task.completed) return false;

            return true;
        });

        // Sort
        switch (sortBy) {
            case 'dueDate':
                filtered.sort((a, b) => {
                    if (!a.dueDate) return 1;
                    if (!b.dueDate) return -1;
                    return new Date(a.dueDate) - new Date(b.dueDate);
                });
                break;
            case 'priority':
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'assignee':
                filtered.sort((a, b) => a.assignee.localeCompare(b.assignee));
                break;
            default:
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>📝 No tasks found. Create one to get started!</p></div>';
            return;
        }

        container.innerHTML = filtered.map(task => {
            const today = new Date().toISOString().split('T')[0];
            const isOverdue = task.dueDate && task.dueDate < today && !task.completed;
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            const progressPercent = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;

            return `
                <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority">
                    <div class="task-header">
                        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
                        <span class="task-title">${this.escapeHtml(task.title)}</span>
                        <span class="task-priority-badge priority-${task.priority}">${task.priority}</span>
                    </div>

                    ${task.description ? `<p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">${this.escapeHtml(task.description)}</p>` : ''}

                    <div class="task-meta">
                        ${task.dueDate ? `
                            <span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                                📅 ${new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                ${isOverdue ? '(OVERDUE)' : ''}
                            </span>
                        ` : ''}
                        ${task.assignee ? `<span class="task-assignee">👤 ${this.escapeHtml(task.assignee)}</span>` : ''}
                    </div>

                    ${task.tags.length > 0 ? `
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="task-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}

                    ${task.subtasks.length > 0 ? `
                        <div class="task-progress">
                            ${completedSubtasks}/${task.subtasks.length} subtasks completed
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progressPercent}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="task-actions">
                        <button class="btn-sm-icon edit-task-btn" data-task-id="${task.id}">✏️ Edit</button>
                        <button class="btn-sm-icon delete-task-btn" data-task-id="${task.id}">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleTaskComplete(parseInt(e.target.dataset.taskId));
            });
        });

        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.openTaskModal(parseInt(e.target.dataset.taskId));
            });
        });

        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                if (confirm('Delete this task?')) {
                    this.tasks = this.tasks.filter(t => t.id !== taskId);
                    this.saveTasks();
                    this.renderTasks();
                    this.updateListCounts();
                }
            });
        });
    }

    closeModal() {
        document.getElementById('taskModal').classList.remove('active');
        window.currentTaskId = null;
    }

    openAddListModal() {
        document.getElementById('addListModal').classList.add('active');
        document.getElementById('newListName').focus();
    }

    closeAddListModal() {
        document.getElementById('addListModal').classList.remove('active');
    }

    createCustomList() {
        const name = document.getElementById('newListName').value.trim();
        if (!name) {
            this.showNotification('Please enter a list name', 'error');
            return;
        }

        const customList = {
            id: 'custom-' + Date.now(),
            name
        };

        this.customLists.push(customList);
        this.saveCustomLists();
        this.renderCustomLists();
        this.closeAddListModal();
        document.getElementById('newListName').value = '';
        this.showNotification('List created successfully!', 'success');
    }

    renderCustomLists() {
        const container = document.getElementById('customLists');
        container.innerHTML = this.customLists.map(list => `
            <div class="list-item" data-list-id="${list.id}">
                <span class="list-name">📋 ${this.escapeHtml(list.name)}</span>
                <span class="list-count">${this.tasks.filter(t => t.list === list.id).length}</span>
            </div>
        `).join('');

        document.querySelectorAll('#customLists .list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.list-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.currentList = item.dataset.listId;
                this.renderTasks();
            });
        });
    }

    updateListCounts() {
        document.querySelectorAll('.list-item').forEach(item => {
            const listId = item.dataset.listId;
            let count = 0;

            if (listId === 'inbox') {
                count = this.tasks.filter(t => !t.completed && t.list === 'inbox').length;
            } else if (listId === 'today') {
                const today = new Date().toISOString().split('T')[0];
                count = this.tasks.filter(t => !t.completed && t.dueDate === today).length;
            } else if (listId === 'upcoming') {
                const today = new Date().toISOString().split('T')[0];
                count = this.tasks.filter(t => !t.completed && t.dueDate && t.dueDate > today).length;
            } else if (listId === 'completed') {
                count = this.tasks.filter(t => t.completed).length;
            } else {
                count = this.tasks.filter(t => t.list === listId && !t.completed).length;
            }

            item.querySelector('.list-count').textContent = count;
        });
    }

    updateTagsList() {
        const allTags = new Set();
        this.tasks.forEach(task => {
            task.tags.forEach(tag => allTags.add(tag));
        });

        const container = document.getElementById('tagsList');
        container.innerHTML = Array.from(allTags).map(tag => `
            <span class="tag-badge">#${this.escapeHtml(tag)}</span>
        `).join('');
    }

    checkReminders() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (task.completed || !task.dueDate || !task.reminders.length) return;

            task.reminders.forEach(reminder => {
                const dueDate = new Date(task.dueDate);
                let reminderTime = new Date(dueDate);

                if (reminder.type === 'before') {
                    const value = parseInt(reminder.value);
                    const unit = reminder.value.includes('hour') ? 'hours' : reminder.value.includes('day') ? 'days' : 'minutes';
                    
                    if (unit === 'hours') reminderTime.setHours(reminderTime.getHours() - value);
                    else if (unit === 'days') reminderTime.setDate(reminderTime.getDate() - value);
                    else reminderTime.setMinutes(reminderTime.getMinutes() - value);
                }

                // Check if reminder time is within the last minute
                const timeDiff = now - reminderTime;
                if (timeDiff >= 0 && timeDiff < 60000) {
                    this.sendNotification(task);
                }
            });
        });
    }

    sendNotification(task) {
        const title = `Task Reminder: ${task.title}`;
        const options = {
            icon: '📋',
            badge: '📋',
            body: `Due: ${new Date(task.dueDate).toLocaleDateString()}`
        };

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options);
        }

        this.showNotification(title, 'warning');
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    loadTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    saveCustomLists() {
        localStorage.setItem('customLists', JSON.stringify(this.customLists));
    }

    loadCustomLists() {
        const lists = localStorage.getItem('customLists');
        return lists ? JSON.parse(lists) : [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const taskManager = new TaskManager();
    taskManager.renderCustomLists();
    taskManager.updateTagsList();
});
