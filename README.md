# Task Manager — Mini-Project

A minimal **Task Manager** application with a **Python Flask** REST API backend and a **vanilla HTML/CSS/JavaScript** frontend. It demonstrates backend implementation, frontend integration with the API, and a clear separation between server and client.

---

## Purpose

The project provides:

- A **task list**: create, list, update (e.g. mark complete), and delete tasks.
- A **weather** feature that uses a **free external API** (Open-Meteo) via the backend, showing how we use APIs to retrieve useful information.

It is kept intentionally small to focus on:

- RESTful API design and implementation
- Frontend-backend integration via HTTP and JSON
- **Consuming external APIs** (weather) and exposing them through our own API
- Error handling and user feedback
- A structure that is easy to deploy and extend

---

## Directory Structure

```
mini-project/
├── backend/
│   ├── app.py           # Flask application and API routes
│   ├── data.py          # In-memory data store for tasks
│   ├── weather_service.py  # Open-Meteo API client (free, no key)
│   └── requirements.txt # Python dependencies
├── frontend/
│   ├── index.html       # Single-page UI
│   ├── css/
│   │   └── style.css    # Styles
│   └── js/
│       └── app.js       # API calls and DOM updates
├── sample.py            # Optional entry point (see below)
├── README.md            # This file
└── DISCUSSION_AND_EVALUATION.md
```

---

## Backend API

### Technology

- **Python 3**
- **Flask** — web framework
- **Flask-CORS** — CORS headers so the frontend can call the API from another origin or from `file://`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/health` | Health check; returns `{"status": "ok"}`. |
| `GET`  | `/api/weather?q=CityName` | Current weather for a city. Uses [Open-Meteo](https://open-meteo.com/) (free, no API key). Returns location, temperature, condition, humidity, wind. |
| `GET`  | `/api/tasks` | List all tasks. Response: `{"tasks": [...]}`. |
| `POST` | `/api/tasks` | Create a task. Body: `{"title": "...", "description": "..."}`. Title required. |
| `GET`  | `/api/tasks/<id>` | Get one task by ID. |
| `PUT`  | `/api/tasks/<id>` | Update a task. Body can include `title`, `description`, `completed`. |
| `DELETE` | `/api/tasks/<id>` | Delete a task. Returns 204 No Content. |

All task objects have: `id`, `title`, `description`, `completed`. The store is **in-memory** (no database); data is lost on server restart.

### Using external APIs: Weather

The **weather** feature demonstrates how the backend calls **free external APIs** to retrieve useful information:

1. **Open-Meteo Geocoding API** — converts a city name (e.g. `London`) into coordinates.
2. **Open-Meteo Forecast API** — returns current weather (temperature, condition, humidity, wind) for those coordinates.

The frontend does **not** call Open-Meteo directly; it calls our own `GET /api/weather?q=...`. The backend then calls the external APIs and returns a single, simplified JSON response. This keeps API keys (if any) on the server, avoids CORS issues with third-party domains, and shows a clear “our API → external API” flow.

### Running the Backend

```bash
cd mini-project/backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The API will listen on **http://127.0.0.1:5000** (or `PORT` env var). Use `http://127.0.0.1:5000` in the frontend when opening `index.html` from the file system.

---

## Frontend

### Technology

- **HTML5** — structure and form
- **CSS3** — layout and styling (no framework)
- **Vanilla JavaScript** — `fetch()` for all API calls

### Behaviour

- **API base URL**: Set in `js/app.js` as `API_BASE` (default `http://127.0.0.1:5000`). You can override with `window.API_BASE` before loading the script if needed.
- **Health**: On load, the page calls `GET /api/health` and shows “API connected” or an error message.
- **Weather**: User enters a city and clicks “Get weather”. The frontend calls `GET /api/weather?q=CityName`; the backend fetches data from Open-Meteo and returns it. The UI shows location, temperature, condition, humidity, and wind. This illustrates **using APIs to retrieve useful information**.
- **List**: `GET /api/tasks` loads tasks and renders them in a list.
- **Add**: The form sends `POST /api/tasks` with `title` and optional `description`, then refreshes the list.
- **Toggle**: “Done” / “Undo” sends `PUT /api/tasks/<id>` with `{ "completed": true/false }` and updates the list item.
- **Delete**: “Delete” sends `DELETE /api/tasks/<id>` and removes the item from the list.

Errors (network or 4xx/5xx) are shown in the UI (e.g. form message or tasks section).

### Running the Frontend

1. Start the backend (see above).
2. Open `frontend/index.html` in a browser (double-click or `file:///.../frontend/index.html`).

For production you would typically serve the frontend from the same host or a static server and set `API_BASE` to the real API URL.

---

## Deployment Notes

- **Backend**: Run with `PORT=8080 python app.py` (or use gunicorn: `gunicorn -w 1 -b 0.0.0.0:5000 app:app`). No database is required for this minimal version.
- **Frontend**: Serve the `frontend/` directory with any static file server (e.g. Nginx, Apache, or `python -m http.server`). Set `API_BASE` to the public API URL.
- **CORS**: The app enables CORS for `/api/*` so the frontend can call the API from a different origin.

---

## Optional: `sample.py`

You can keep `sample.py` as a stub or use it to run the Flask app from the project root, for example:

```python
# Run the Flask backend from project root
import os
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from app import app
app.run(host="0.0.0.0", port=5000, debug=True)
```

Then: `python sample.py` from `mini-project/`.

---

## Summary

- **Backend**: Flask app in `backend/` with RESTful routes, in-memory task store, and a weather service that calls the free Open-Meteo API.
- **Frontend**: Single page in `frontend/` that uses our API for tasks and weather, and shows status and errors.
- **External APIs**: Weather data is retrieved via Open-Meteo (no API key); the backend proxies it through `GET /api/weather` to show how we use APIs to retrieve useful information.
- **Docs**: This README and `DISCUSSION_AND_EVALUATION.md` describe the project, API, integration, and evaluation.
