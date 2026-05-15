# Design: Inbox & Daily Tasks (v1.3)

## Overview
Implementation of an autonomous task management system ("Inbox"). This update simplifies the persistence logic and removal process.

## Requirements
- Autonomous tasks separate from the graph.
- **Deadline-based Expiry (Incomplete Tasks)**:
    - **No Date**: Task carries over infinitely until completed.
    - **Specific Date (Future)**: Task carries over until the due date.
    - **Today**: Task does NOT carry over to the next day if incomplete (expires at midnight).
- **Manual Deletion (Completed Tasks)**:
    - Completed tasks stay in the list **indefinitely**.
    - No automatic expiry or archiving for completed tasks.
    - User must manually delete tasks to remove them from the record.
    - No confirmation prompt required upon completion.
- Impact Levels (Priorities): Low, Medium, High, Critical.

## Proposed Changes

### Database (Supabase)
Table `tasks`:
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key)
- `text`: TEXT
- `is_completed`: BOOLEAN
- `priority`: INTEGER (0-3)
- `due_date`: DATE (Nullable)
- `created_at`: TIMESTAMP
- `completed_at`: TIMESTAMP

### Logic: Task Visibility
1. **Active/Incomplete**: Shown if `is_completed = false` AND (`due_date` IS NULL OR `due_date >= CURRENT_DATE`).
2. **Completed**: Shown if `is_completed = true`. Stays forever until manual `DELETE`.

### UI/UX
- **Inbox Page**:
    - **Active Section**: Tasks filtered by the expiry logic.
    - **Completed Section**: All completed tasks waiting for manual deletion.
    - Simple "Trash" icon for immediate deletion of any task.
- **Impact Levels**: Visual cues (colors/glow) based on priority.

## Verification Plan
1. Create task with `due_date = Today`. Verify it disappears tomorrow if incomplete.
2. Create task with `no due_date`. Verify it stays.
3. Mark task as done. Verify it stays in the "Completed" section regardless of time/deadline.
4. Manually delete task. Verify it is removed from DB.
5. Filter by Impact Level.
