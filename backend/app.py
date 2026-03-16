"""
Flask backend API for the Task Manager mini-project.
RESTful endpoints for CRUD operations on tasks.
"""

import json
import logging
import os
import urllib.error
from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from data import (
    get_all_tasks,
    get_task_by_id,
    create_task,
    update_task,
    delete_task,
)
from weather_service import get_weather_for_city

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def _task_id_from_request():
    """Parse task ID from request path; returns (id, error_response)."""
    try:
        raw = request.view_args.get("task_id")
        return int(raw), None
    except (TypeError, ValueError):
        return None, (jsonify({"error": "Invalid task ID"}), 400)


# ---------- API Routes ----------


@app.route("/api/health", methods=["GET"])
def health():
    """Health check for deployment and monitoring."""
    return jsonify({"status": "ok", "service": "task-manager-api"})


@app.route("/api/weather", methods=["GET"])
def weather():
    """
    GET /api/weather?q=CityName — Current weather via free Open-Meteo API.
    Demonstrates using external APIs to retrieve useful information.
    """
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Query parameter 'q' (city name) is required"}), 400
    try:
        data = get_weather_for_city(q)
        return jsonify(data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as e:
        logger.exception("Weather API request failed")
        err_msg = "Weather service temporarily unavailable"
        if app.debug:
            err_msg += f": {type(e).__name__}: {e}"
        return jsonify({"error": err_msg}), 502
    except (KeyError, TypeError, json.JSONDecodeError) as e:
        logger.exception("Weather API response parsing failed")
        err_msg = "Weather service returned unexpected data"
        if app.debug:
            err_msg += f": {type(e).__name__}: {e}"
        return jsonify({"error": err_msg}), 502


@app.route("/api/tasks", methods=["GET"])
def list_tasks():
    """GET /api/tasks — List all tasks."""
    tasks = get_all_tasks()
    return jsonify({"tasks": tasks})


@app.route("/api/tasks", methods=["POST"])
def add_task():
    """POST /api/tasks — Create a new task."""
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    if not title:
        return jsonify({"error": "Title is required"}), 400
    description = data.get("description", "").strip()
    task = create_task(title=title, description=description)
    return jsonify(task), 201


@app.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    """GET /api/tasks/<id> — Get a single task."""
    task = get_task_by_id(task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)


@app.route("/api/tasks/<int:task_id>", methods=["PUT"])
def put_task(task_id):
    """PUT /api/tasks/<id> — Update a task (partial updates supported)."""
    task = get_task_by_id(task_id)
    if task is None:
        return jsonify({"error": "Task not found"}), 404
    data = request.get_json(silent=True) or {}
    title = data.get("title")
    if title is not None:
        title = str(title).strip()
        if not title:
            return jsonify({"error": "Title cannot be empty"}), 400
    description = data.get("description")
    if description is not None:
        description = str(description).strip()
    completed = data.get("completed")
    if completed is not None:
        completed = bool(completed)
    updated = update_task(
        task_id,
        title=title,
        description=description,
        completed=completed,
    )
    return jsonify(updated)


@app.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def remove_task(task_id):
    """DELETE /api/tasks/<id> — Delete a task."""
    if not delete_task(task_id):
        return jsonify({"error": "Task not found"}), 404
    return "", 204


# ---------- Error handlers ----------


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
