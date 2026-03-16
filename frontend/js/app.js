/**
 * Task Manager — Frontend
 * Integrates with the Flask backend API.
 */

const API_BASE = window.API_BASE || "http://127.0.0.1:5000";

const els = {
  apiStatus: document.getElementById("api-status"),
  formAdd: document.getElementById("form-add"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  formMessage: document.getElementById("form-message"),
  tasksLoading: document.getElementById("tasks-loading"),
  tasksError: document.getElementById("tasks-error"),
  taskList: document.getElementById("task-list"),
  weatherCity: document.getElementById("weather-city"),
  weatherFetch: document.getElementById("weather-fetch"),
  weatherLoading: document.getElementById("weather-loading"),
  weatherError: document.getElementById("weather-error"),
  weatherResult: document.getElementById("weather-result"),
};

function showMessage(container, text, type = "info") {
  container.textContent = text;
  container.className = "message " + (type === "error" ? "error" : "success");
  container.hidden = false;
  if (type === "success") {
    setTimeout(() => {
      container.textContent = "";
      container.hidden = true;
    }, 3000);
  }
}

function setApiStatus(connected, message) {
  els.apiStatus.textContent = message || (connected ? "API connected" : "API disconnected");
  els.apiStatus.className = "status " + (connected ? "connected" : "error");
  els.apiStatus.hidden = false;
}

async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    setApiStatus(res.ok, res.ok ? "API connected" : "API error");
    return res.ok;
  } catch (e) {
    setApiStatus(false, "Cannot reach API. Is the backend running on " + API_BASE + "?");
    return false;
  }
}

async function fetchTasks() {
  els.tasksLoading.hidden = false;
  els.tasksError.hidden = true;
  els.taskList.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/api/tasks`);
    if (!res.ok) throw new Error("Failed to load tasks");
    const data = await res.json();
    renderTasks(data.tasks || []);
  } catch (e) {
    els.tasksError.textContent = e.message || "Failed to load tasks.";
    els.tasksError.hidden = false;
  } finally {
    els.tasksLoading.hidden = true;
  }
}

function renderTasks(tasks) {
  if (!tasks.length) {
    els.taskList.innerHTML = '<li class="empty-state">No tasks yet. Add one above.</li>';
    return;
  }
  els.taskList.innerHTML = tasks
    .map(
      (t) => `
    <li class="task-item ${t.completed ? "completed" : ""}" data-id="${t.id}">
      <div class="task-content">
        <p class="task-title">${escapeHtml(t.title)}</p>
        ${t.description ? `<p class="task-description">${escapeHtml(t.description)}</p>` : ""}
      </div>
      <div class="task-actions">
        <button type="button" class="task-toggle" aria-label="Toggle complete">${t.completed ? "Undo" : "Done"}</button>
        <button type="button" class="task-delete" aria-label="Delete task">Delete</button>
      </div>
    </li>`
    )
    .join("");

  els.taskList.querySelectorAll(".task-toggle").forEach((btn) => {
    btn.addEventListener("click", handleToggle);
  });
  els.taskList.querySelectorAll(".task-delete").forEach((btn) => {
    btn.addEventListener("click", handleDelete);
  });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function getTaskIdFromButton(btn) {
  const item = btn.closest(".task-item");
  return item ? parseInt(item.dataset.id, 10) : null;
}

async function handleToggle(e) {
  const id = getTaskIdFromButton(e.target);
  if (id == null) return;
  const item = e.target.closest(".task-item");
  const newCompleted = !item.classList.contains("completed");

  try {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: newCompleted }),
    });
    if (!res.ok) throw new Error("Update failed");
    const updated = await res.json();
    item.classList.toggle("completed", updated.completed);
    e.target.textContent = updated.completed ? "Undo" : "Done";
  } catch (err) {
    showMessage(els.formMessage, "Failed to update task.", "error");
  }
}

async function handleDelete(e) {
  const id = getTaskIdFromButton(e.target);
  if (id == null) return;

  try {
    const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    e.target.closest(".task-item").remove();
    if (!els.taskList.querySelector(".task-item")) {
      els.taskList.innerHTML = '<li class="empty-state">No tasks yet. Add one above.</li>';
    }
  } catch (err) {
    showMessage(els.formMessage, "Failed to delete task.", "error");
  }
}

els.formAdd.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = els.title.value.trim();
  if (!title) {
    showMessage(els.formMessage, "Title is required.", "error");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: els.description.value.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(els.formMessage, data.error || "Failed to add task.", "error");
      return;
    }
    showMessage(els.formMessage, "Task added.", "success");
    els.title.value = "";
    els.description.value = "";
    fetchTasks();
  } catch (err) {
    showMessage(els.formMessage, "Cannot reach API. Is the backend running?", "error");
  }
});

// ---------- Weather (external API via backend) ----------

async function fetchWeather() {
  const q = els.weatherCity.value.trim();
  if (!q) {
    els.weatherError.textContent = "Enter a city name.";
    els.weatherError.hidden = false;
    els.weatherResult.hidden = true;
    return;
  }
  els.weatherLoading.hidden = false;
  els.weatherError.hidden = true;
  els.weatherResult.hidden = true;

  try {
    const res = await fetch(`${API_BASE}/api/weather?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    if (!res.ok) {
      els.weatherError.textContent = data.error || "Failed to get weather.";
      els.weatherError.hidden = false;
      return;
    }
    renderWeather(data);
    els.weatherResult.hidden = false;
  } catch (e) {
    els.weatherError.textContent = "Cannot reach API. Is the backend running?";
    els.weatherError.hidden = false;
  } finally {
    els.weatherLoading.hidden = true;
  }
}

function renderWeather(data) {
  const cur = data.current_conditions || {};
  const days = data.daily_forecast || [];

  // Current conditions block
  const loc = cur.location || (data.location + (data.country ? `, ${data.country}` : ""));
  const tempC = cur.temperature_c != null ? cur.temperature_c : data.temperature;
  const tempF = cur.temperature_f != null ? cur.temperature_f : (tempC != null ? Math.round(tempC * 9 / 5 + 32) : null);
  const tempStr = tempC != null ? `${tempC}°C / ${tempF}°F` : "—";
  const desc = cur.description || data.condition || "—";
  const humidity = cur.humidity_percent != null ? cur.humidity_percent : data.humidity_percent;
  const wind = cur.wind || (data.wind_speed_kmh != null ? `${data.wind_speed_kmh} km/h` : "");

  let html =
    '<div class="weather-current">' +
    '<h3 class="weather-current-heading">Current conditions</h3>' +
    `<p class="location-name">${escapeHtml(loc)}</p>` +
    `<p class="temp">${escapeHtml(tempStr)}</p>` +
    `<p class="condition">${escapeHtml(desc)}</p>` +
    (humidity != null ? `<p class="meta">Humidity: ${escapeHtml(String(humidity))}%</p>` : "") +
    (wind ? `<p class="meta">Wind: ${escapeHtml(wind)}</p>` : "") +
    "</div>";

  // 7-day forecast with collapsible sections
  if (days.length > 0) {
    html += '<div class="weather-forecast"><h3 class="weather-forecast-heading">7-day forecast</h3>';
    html += '<div class="forecast-list">';
    days.forEach((day, idx) => {
      const highLow = [day.high_c != null && day.low_c != null
        ? `High: ${day.high_c}°C / ${day.high_f}°F — Low: ${day.low_c}°C / ${day.low_f}°F`
        : ""].filter(Boolean).join(" ") || "—";
      const precip = day.precipitation_probability_max != null
        ? `${day.precipitation_probability_max}% chance of precipitation`
        : "";
      const windDay = day.wind_speed_kmh_max != null ? `${day.wind_speed_kmh_max} km/h` : "";
      const details =
        `<p class="forecast-desc">${escapeHtml(day.description || day.condition || "—")}</p>` +
        (precip ? `<p class="forecast-meta">Precipitation: ${escapeHtml(precip)}</p>` : "") +
        (windDay ? `<p class="forecast-meta">Wind: ${escapeHtml(windDay)}</p>` : "");
      const id = "forecast-day-" + idx;
      const firstOpen = idx === 0;
      html +=
        '<div class="forecast-day">' +
        `<button type="button" class="forecast-day-toggle${firstOpen ? " forecast-day-toggle-open" : ""}" aria-expanded="${firstOpen}" aria-controls="${id}" data-index="${idx}">` +
        `<span class="forecast-day-label">Day ${day.day_number}: ${escapeHtml(day.date_formatted || day.date || "")}</span>` +
        `<span class="forecast-day-highlow">${escapeHtml(highLow)}</span>` +
        '<span class="forecast-day-chevron" aria-hidden="true"></span>' +
        "</button>" +
        `<div id="${id}" class="forecast-day-details" ${firstOpen ? "" : "hidden"}>${details}</div>` +
        "</div>";
    });
    html += "</div></div>";
  }

  if (data.source) {
    html += `<p class="source">Data: ${escapeHtml(data.source)}</p>`;
  }
  els.weatherResult.innerHTML = html;

  // Toggle handlers for collapsible forecast days
  els.weatherResult.querySelectorAll(".forecast-day-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const details = document.getElementById(btn.getAttribute("aria-controls"));
      const expanded = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", !expanded);
      details.hidden = expanded;
      btn.classList.toggle("forecast-day-toggle-open", !expanded);
    });
  });
}

if (els.weatherFetch) {
  els.weatherFetch.addEventListener("click", fetchWeather);
}
if (els.weatherCity) {
  els.weatherCity.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchWeather();
    }
  });
}

// Initial load
checkHealth();
fetchTasks();
