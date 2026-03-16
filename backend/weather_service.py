"""
Weather service using free external APIs (Open-Meteo).
Provides current conditions and 7-day daily forecast for a location.
No API key required for non-commercial use.
"""

import json
from datetime import datetime
import urllib.error
import urllib.parse
import urllib.request

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# WMO weather code to short description (common codes)
WEATHER_LABELS = {
    0: "Clear",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
}

# Wind direction in degrees to compass label (short and long for display)
WIND_DIRECTIONS = [
    (22.5, "N", "North"), (67.5, "NE", "Northeast"), (112.5, "E", "East"),
    (157.5, "SE", "Southeast"), (202.5, "S", "South"), (247.5, "SW", "Southwest"),
    (292.5, "W", "West"), (337.5, "NW", "Northwest"), (360, "N", "North"),
]


def _get_json(url, params=None):
    """Fetch URL and return parsed JSON. Raises on HTTP/JSON errors."""
    if params:
        # Ensure values are strings for urlencode (e.g. lat/lon can be float)
        params = {k: str(v) if not isinstance(v, str) else v for k, v in params.items()}
        url = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "TaskManager-MiniProject/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


def _weather_description(code):
    """Return human-readable weather for WMO code."""
    try:
        return WEATHER_LABELS.get(int(code), "Unknown")
    except (TypeError, ValueError):
        return "Unknown"


def _wind_direction(degrees, long_form=False):
    """Convert wind direction in degrees to compass label (e.g. 'West')."""
    if degrees is None:
        return ""
    try:
        d = float(degrees) % 360
        for threshold, short_l, long_l in WIND_DIRECTIONS:
            if d < threshold:
                return long_l if long_form else short_l
        return "North" if long_form else "N"
    except (TypeError, ValueError):
        return ""


def _c_to_f(c):
    """Convert Celsius to Fahrenheit."""
    if c is None:
        return None
    try:
        return round(float(c) * 9 / 5 + 32, 1)
    except (TypeError, ValueError):
        return None


def _format_date(iso_date_str):
    """Format YYYY-MM-DD to readable short date (e.g. 'Mon 16 Mar')."""
    try:
        dt = datetime.strptime(iso_date_str[:10], "%Y-%m-%d")
        return dt.strftime("%a %d %b")
    except (ValueError, TypeError):
        return iso_date_str[:10] if iso_date_str else ""


def _day_summary_description(code, precip_prob, precip_sum):
    """Build a short descriptive summary for a forecast day."""
    cond = _weather_description(code)
    parts = [cond]
    if (precip_prob or 0) > 0:
        parts.append(f"{precip_prob}% chance of precipitation")
    if (precip_sum or 0) > 0:
        parts.append(f"({precip_sum} mm expected)")
    return ". ".join(parts) if len(parts) > 1 else cond + "."


def get_weather_for_city(query):
    """
    Get current conditions and 7-day daily forecast for a city name.
    Uses Open-Meteo Geocoding + Forecast APIs.
    Returns dict with current_conditions, daily_forecast, and legacy flat fields.
    Raises ValueError if location not found or API error.
    """
    query = (query or "").strip()
    if len(query) < 2:
        raise ValueError("Enter at least 2 characters for city name")

    # 1) Geocoding: city name -> lat, lon
    geo = _get_json(GEOCODING_URL, {"name": query, "count": 1})
    results = geo.get("results") or []
    if not results:
        raise ValueError(f"Location not found: {query}")
    loc = results[0]
    lat = loc.get("latitude")
    lon = loc.get("longitude")
    if lat is None or lon is None:
        raise ValueError("Geocoding returned invalid location data")
    name = loc.get("name", query)
    country = loc.get("country_code", "")

    # 2) Forecast: current + daily (7 days). Do not request "time" in daily (API returns it by default; requesting it causes 400).
    forecast = _get_json(
        FORECAST_URL,
        {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,wind_direction_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum",
            "forecast_days": 7,
        },
    )
    current = forecast.get("current") or {}
    daily = forecast.get("daily") or {}
    time_list = daily.get("time") or []
    code_list = daily.get("weather_code") or []
    temp_max_list = daily.get("temperature_2m_max") or []
    temp_min_list = daily.get("temperature_2m_min") or []
    precip_sum_list = daily.get("precipitation_sum") or []

    # Current conditions
    temp_c = current.get("temperature_2m")
    wind_deg = current.get("wind_direction_10m")
    wind_dir = _wind_direction(wind_deg, long_form=True)
    wind_speed = current.get("wind_speed_10m")
    wind_text = f"{wind_speed} km/h" if wind_speed is not None else ""
    if wind_text and wind_dir:
        wind_text += f" from the {wind_dir}"
    current_conditions = {
        "location": f"{name}, {country}" if country else name,
        "temperature_c": temp_c,
        "temperature_f": _c_to_f(temp_c),
        "description": _weather_description(current.get("weather_code", 0)),
        "humidity_percent": current.get("relative_humidity_2m"),
        "wind": wind_text,
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "wind_direction": wind_dir,
    }

    # 7-day daily forecast (no daily wind or precip probability in API response)
    daily_forecast = []
    for i in range(min(7, len(time_list))):
        date_str = time_list[i] if i < len(time_list) else ""
        code = code_list[i] if i < len(code_list) else 0
        high_c = temp_max_list[i] if i < len(temp_max_list) else None
        low_c = temp_min_list[i] if i < len(temp_min_list) else None
        precip_sum = precip_sum_list[i] if i < len(precip_sum_list) else None
        # Derive a simple "precipitation chance" from weather code and precip sum for display
        precip_prob = None
        if (precip_sum or 0) > 0 or code in (51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99):
            precip_prob = 50 if (precip_sum or 0) > 0 else 30
        daily_forecast.append({
            "date": date_str,
            "date_formatted": _format_date(date_str),
            "day_number": i + 1,
            "high_c": high_c,
            "low_c": low_c,
            "high_f": _c_to_f(high_c),
            "low_f": _c_to_f(low_c),
            "condition": _weather_description(code),
            "weather_code": code,
            "precipitation_probability_max": precip_prob,
            "precipitation_sum": precip_sum,
            "wind_speed_kmh_max": None,
            "description": _day_summary_description(code, precip_prob, precip_sum),
        })

    # Legacy flat fields (backward compatibility)
    return {
        "location": name,
        "country": country,
        "latitude": lat,
        "longitude": lon,
        "temperature": temp_c,
        "temperature_unit": "°C",
        "condition": current_conditions["description"],
        "weather_code": current.get("weather_code", 0),
        "humidity_percent": current_conditions["humidity_percent"],
        "wind_speed_kmh": current.get("wind_speed_10m"),
        "source": "Open-Meteo",
        "current_conditions": current_conditions,
        "daily_forecast": daily_forecast,
    }
