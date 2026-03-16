"""
In-memory data store for tasks.
Provides a simple, stateless-friendly store (resets on server restart).
"""

from typing import List, Dict, Optional
# In-memory task store: list of dicts with id, title, description, completed, created_at
_tasks: List[Dict] = []
_next_id = 1


def _generate_id() -> int:
    global _next_id
    uid = _next_id
    _next_id += 1
    return uid


def get_all_tasks() -> List[Dict]:
    """Return all tasks."""
    return list(_tasks)


def get_task_by_id(task_id: int) -> Optional[Dict]:
    """Return a single task by ID or None."""
    for t in _tasks:
        if t["id"] == task_id:
            return dict(t)
    return None


def create_task(title: str, description: str = "") -> Dict:
    """Create a new task and return it."""
    task = {
        "id": _generate_id(),
        "title": title,
        "description": description,
        "completed": False,
    }
    _tasks.append(task)
    return dict(task)


def update_task(task_id: int, title: Optional[str] = None,
                description: Optional[str] = None,
                completed: Optional[bool] = None) -> Optional[Dict]:
    """Update a task by ID. Returns updated task or None if not found."""
    for t in _tasks:
        if t["id"] == task_id:
            if title is not None:
                t["title"] = title
            if description is not None:
                t["description"] = description
            if completed is not None:
                t["completed"] = completed
            return dict(t)
    return None


def delete_task(task_id: int) -> bool:
    """Delete a task by ID. Returns True if deleted, False if not found."""
    for i, t in enumerate(_tasks):
        if t["id"] == task_id:
            _tasks.pop(i)
            return True
    return False
