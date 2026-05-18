# Todo Reminder App

A simple browser-based task manager for creating, organizing, and tracking tasks with reminders, custom lists, tags, and subtask.

This project is a static web app built with HTML, CSS, and JavaScript. It lets users:

- Add tasks quickly from the main input
- Create and manage custom lists
- View default lists: Inbox, Today, Upcoming, Completed
- Filter tasks by priority and status
- Sort tasks by date added, due date, priority, or assignee
- Add task details with description, due date, priority, assignee, tags, subtasks, and reminders
- Enable recurring tasks with daily/weekly/monthly options
- Persist data locally using `localStorage`

## Files

- `index.html` - app markup and UI structure
- `styles.css` - layout and visual styling
- `script.js` - task management functionality and app behavior

## How to run

1. Open `index.html` in any modern browser.
2. Use the input field to add a task.
3. Click task cards to open the task details modal and edit metadata.
4. Use the sidebar to switch lists and the controls bar to filter or sort tasks.

> Note: The app stores tasks in the browser using `localStorage`, so data persists between page reloads on the same device/browser.

## Features

- Task creation and editing
- Task details modal with update and delete actions
- Custom lists and default list navigation
- Task filtering by priority and completion status
- Sort options for better task management
- Subtasks, reminders, and recurring task support
- Notification permission request for reminder alerts

## Notes

- This is a frontend-only prototype; there is no server or database backend.
- Reminder notifications rely on browser Notification API support.
- `localStorage` is used for persistence, so clearing browser data will remove tasks.

## Future improvements

- Add drag-and-drop reorder support
- Support recurring reminders based on due dates
- Add authentication and backend storage
- Improve accessibility and mobile responsiveness
