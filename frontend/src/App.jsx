import { useEffect, useState } from "react";
import "./App.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";

import { LANGUAGES, getText } from "./Languages";

const API = "";

function useLanguage() {
  const [lang, setLang] = useState(
    localStorage.getItem("language") || "en"
  );

  const changeLanguage = (value) => {
    setLang(value);
    localStorage.setItem("language", value);
  };

  return { lang, setLang: changeLanguage };
}
function Layout({ children }) {
  const { lang, setLang } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") || "null")
  );
// FloodFlow Theme Settings
const [theme, setTheme] = useState(
  localStorage.getItem("floodflow-theme") || "ocean"
);

useEffect(() => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("floodflow-theme", theme);
}, [theme]);
  useEffect(() => {
    setUser(
      JSON.parse(localStorage.getItem("user") || "null")
    );
  }, [location.pathname]);

  const t = (key) => getText(lang, key);
  const [alerts, setAlerts] = useState([]);
  const [weatherRisk, setWeatherRisk] = useState(null);
  const [zoneStatus, setZoneStatus] = useState("Safe");
  console.log("WEATHER DATA:", weatherRisk);
  useEffect(() => {
  fetch(`${API}/api/weather-risk`)
    .then((res) => res.json())
    .then((data) => {
      console.log("API WEATHER RESULT:", data);
      setWeatherRisk(data);
    })
    .catch(() => {
      setWeatherRisk(null);
    });
}, []);

useEffect(() => {
  fetch(`${API}/api/flood-alerts`)
    .then((res) => res.json())
    .then((result) => {
      setAlerts(result.alerts || []);
    })
    .catch(() => {
      setAlerts([]);
    });
}, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          🌊 FloodFlow
        </Link>

        <div className="navlinks">
          <Link to="/">{t("home")}</Link>
          <Link to="/alerts">{t("alerts")}</Link>
          <Link to="/shelters">{t("shelters")}</Link>
          <Link to="/assistance">{t("emergency")}</Link>

          {user && (
            <>
              <Link to="/requests">{t("requests")}</Link>
              <Link to="/bookings">{t("bookings")}</Link>
              <Link to="/dashboard">{t("dashboard")}</Link>

              {user.role === "Admin" && (
                <Link to="/admin">{t("admin")}</Link>
              )}
            </>
          )}

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGUAGES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
<select
  className="theme-selector"
  value={theme}
  onChange={(e) => setTheme(e.target.value)}
  aria-label="Select website theme"
>
  <option value="light">☀️ Light</option>
  <option value="dark">🌙 Dark</option>
  <option value="ocean">🌊 Ocean Blue</option>
</select>
          {!user ? (
            <>
              <Link to="/login">{t("login")}</Link>
              <Link to="/register">{t("register")}</Link>
            </>
          ) : (
            <button onClick={logout} className="logout-btn">
              {t("logout")}
            </button>
          )}
        </div>
      </nav>

      <main>{children}</main>
    </>
  );
}
function Home() {
  const { lang } = useLanguage();
  const t = (key) => getText(lang, key);
  const [alerts, setAlerts] = useState([]);
  const [weatherRisk, setWeatherRisk] = useState(null);
  const [zoneStatus, setZoneStatus] = useState("Safe");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [weatherLocation, setWeatherLocation] = useState("");
const [searchedWeather, setSearchedWeather] = useState(null);
const [weatherLoading, setWeatherLoading] = useState(false);
  useEffect(() => {
  const online = () => setIsOffline(false);
  const offline = () => setIsOffline(true);

  window.addEventListener("online", online);
  window.addEventListener("offline", offline);

  return () => {
    window.removeEventListener("online", online);
    window.removeEventListener("offline", offline);
  };
}, []);

  useEffect(() => {
    fetch(`${API}/api/flood-alerts`)
      .then((res) => res.json())
      .then((result) => {
        setAlerts(result.alerts || []);
      })
      .catch(() => {
        setAlerts([]);
      });
  }, []);

  useEffect(() => {
    fetch(`${API}/api/weather-risk`)
      .then((res) => res.json())
      .then((data) => {
        setWeatherRisk(data);
        if (data.risk_level === "High") {
  setZoneStatus("Danger");
} else if (data.risk_level === "Medium") {
  setZoneStatus("Warning");
} else {
  setZoneStatus("Safe");
}
      })
      .catch(() => {
        setWeatherRisk(null);
      });
  }, []);
const searchWeather = async () => {
  if (!weatherLocation.trim()) {
    alert("Please enter a location");
    return;
  }

  setWeatherLoading(true);

  try {
    const res = await fetch(
      `${API}/api/weather-search?location=${encodeURIComponent(weatherLocation)}`
    );

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Location not found");
      return;
    }

    setSearchedWeather(data);
    console.log("SEARCHED WEATHER:", data);
  } catch (error) {
    alert("Cannot connect to weather service");
  } finally {
    setWeatherLoading(false);
  }
};
  return (
    <div className="home">
     
     {weatherRisk && (
  <div
  style={{
    background: "lightgreen",
    padding: "15px",
    margin: "15px",
    borderRadius: "10px",
    textAlign: "center",
  }}
>
    🌧️ <b>{weatherRisk.risk_level} Risk:</b>{" "}
    {weatherRisk.message}
    <br />
    <small>
      Current Rainfall: {weatherRisk.rainfall_mm} mm
    </small>
  </div>
)}
<div
  style={{
    maxWidth: "600px",
    margin: "15px auto",
    padding: "18px",
    borderRadius: "12px",
    textAlign: "center",
    fontWeight: "bold",
    background:
      zoneStatus === "Danger"
        ? "#ffdddd"
        : zoneStatus === "Warning"
        ? "#fff0cc"
        : "#ddf5dd",
    border:
      zoneStatus === "Danger"
        ? "2px solid #d62828"
        : zoneStatus === "Warning"
        ? "2px solid #f4a261"
        : "2px solid #43a047",
  }}
>
  <h2>
    {zoneStatus === "Danger"
      ? "🔴 Danger Zone"
      : zoneStatus === "Warning"
      ? "⚠️ Warning Zone"
      : "🟢 Safe Zone"}
  </h2>

  <p>
    Current Area Status: <b>{zoneStatus}</b>
  </p>
</div>
{isOffline && (
  <div
    style={{
      background: "#fff3cd",
      border: "2px solid #f0ad4e",
      padding: "15px",
      margin: "15px auto",
      maxWidth: "600px",
      borderRadius: "10px",
      textAlign: "center",
      fontWeight: "bold",
    }}
  >
    📴 You are currently offline.
    <br />
    Emergency information may be limited.
  </div>
)}
<div
  style={{
    maxWidth: "850px",
    margin: "28px auto",
    padding: "28px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #e0f2fe, #ffffff)",
    border: "1px solid #bae6fd",
    boxShadow: "0 10px 30px rgba(0, 80, 150, 0.12)",
  }}
>
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "42px" }}>🌦️</div>

    <h2 style={{ margin: "8px 0" }}>
      Check Local Weather
    </h2>

    <p style={{ color: "#64748b", marginBottom: "20px" }}>
      Search any city to check live weather conditions
    </p>

    <div
      style={{
        display: "flex",
        gap: "10px",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <input
        type="text"
        placeholder="🔍 Search city e.g. Mumbai"
        value={weatherLocation}
        onChange={(e) => setWeatherLocation(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            searchWeather();
          }
        }}
        style={{
          flex: 1,
          padding: "13px 16px",
          borderRadius: "12px",
          border: "1px solid #cbd5e1",
          fontSize: "15px",
          outline: "none",
        }}
      />

      <button
        className="btn primary"
        onClick={searchWeather}
        disabled={weatherLoading}
        style={{
          borderRadius: "12px",
          padding: "12px 18px",
        }}
      >
        {weatherLoading ? "Checking..." : "Check Weather"}
      </button>
    </div>
  </div>

  {searchedWeather && (
    <div style={{ marginTop: "28px" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: "22px",
        }}
      >
        <p
          style={{
            margin: "0",
            color: "#64748b",
            fontSize: "14px",
          }}
        >
          Current Weather
        </p>

        <h2
          style={{
            margin: "6px 0",
            fontSize: "26px",
          }}
        >
          📍 {searchedWeather.location}
          {searchedWeather.country
            ? `, ${searchedWeather.country}`
            : ""}
        </h2>

        <div
          style={{
            fontSize: "52px",
            fontWeight: "700",
            color: "#0369a1",
          }}
        >
          🌡️ {searchedWeather.temperature}°C
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "14px",
        }}
      >
        <div
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "#ffffff",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "28px" }}>🌧️</div>
          <p style={{ margin: "6px 0", color: "#64748b" }}>
            Rainfall
          </p>
          <h3 style={{ margin: 0 }}>
            {searchedWeather.rainfall} mm
          </h3>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "#ffffff",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "28px" }}>💧</div>
          <p style={{ margin: "6px 0", color: "#64748b" }}>
            Humidity
          </p>
          <h3 style={{ margin: 0 }}>
            {searchedWeather.humidity}%
          </h3>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "#ffffff",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ fontSize: "28px" }}>⚠️</div>
          <p style={{ margin: "6px 0", color: "#64748b" }}>
            Flood Risk
          </p>
          <h3
            style={{
              margin: 0,
              color:
                searchedWeather.risk === "High"
                  ? "#dc2626"
                  : searchedWeather.risk === "Medium"
                  ? "#d97706"
                  : "#16a34a",
            }}
          >
            {searchedWeather.risk}
          </h3>
        </div>
      </div>
      <div style={{ marginTop: "28px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "18px" }}>
          📅 5-Day Forecast
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "14px",
          }}
        >
          {searchedWeather.forecast?.map((day, index) => (
            <div
              key={day.date}
              style={{
                padding: "18px",
                borderRadius: "18px",
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: "600" }}>
                {index === 0 ? "Today" : day.date}
              </p>

              <div style={{ fontSize: "30px" }}>🌦️</div>

              <h3 style={{ margin: "8px 0" }}>
                {day.max}°C / {day.min}°C
              </h3>

              <p style={{ margin: "5px 0", color: "#64748b" }}>
                🌧️ {day.rainfall} mm
              </p>

              <p style={{ margin: "5px 0", color: "#64748b" }}>
                💧 {day.rain_probability}%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
      <section className="hero">
        <h1>🌊 FloodFlow</h1>

        <h2>{t("floodEvacuation")}</h2>

        <p>{t("staySafe")}</p>

        <div className="hero-buttons">
          <Link to="/alerts" className="btn primary">
            ⚠️ {t("alerts")}
          </Link>

          <Link to="/shelters" className="btn">
            🏠 {t("findShelter")}
          </Link>

          <Link to="/assistance" className="btn danger">
            🚨 {t("emergencyHelp")}
          </Link>
        </div>
      </section>

      <section className="features">

        <div className="feature-card">
          <h3>⚠️</h3>
          <h3>{t("monitorFlood")}</h3>
          <p>{t("checkAlerts")}</p>
        </div>

        <div className="feature-card">
          <h3>🏠</h3>
          <h3>{t("findShelter")}</h3>
          <p>{t("findNearbyShelters")}</p>
        </div>

        <div className="feature-card">
          <h3>🚑</h3>
          <h3>{t("submitEmergency")}</h3>
          <p>{t("requestAssistance")}</p>
        </div>

      </section>

      <section className="services">
        <h2>{t("emergencyHelp")}</h2>

        <div className="service-grid">

          <div className="service-card">
            🍱
            <h3>{t("food")}</h3>
          </div>

          <div className="service-card">
            💧
            <h3>{t("water")}</h3>
          </div>

          <div className="service-card">
            💊
            <h3>{t("medicine")}</h3>
          </div>

          <div className="service-card">
            🚑
            <h3>{t("medical")}</h3>
          </div>

          <div className="service-card">
            🛟
            <h3>{t("rescue")}</h3>
          </div>

          <div className="service-card">
            🏠
            <h3>{t("shelter")}</h3>
          </div>

        </div>
      </section>

    </div>
  );
}
function PageHeading({ title, subtitle }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      {text}
    </div>
  );
}
function Loading() {
  return (
    <div className="loading">
      Loading...
    </div>
  );
}

function Alerts() {
  const [data, setData] = useState([]);
  const { lang } = useLanguage();

  const t = (key) => getText(lang, key);

  useEffect(() => {
    fetch(`${API}/api/flood-alerts`)
      .then((res) => res.json())
      .then((result) => {
        setData(result.alerts || []);
      })
      .catch(() => {
        setData([]);
      });
  }, []);

  return (
    <div className="page">
      <PageHeading
        title={t("floodAlerts")}
        subtitle={t("currentAlerts")}
      />

      {data.length === 0 ? (
        <Empty text="No flood alerts available" />
      ) : (
        <div className="grid">
          {data.map((alert) => (
            <div className="card" key={alert.id}>

              <h3>⚠️ {alert.location}</h3>

              <p>
                <b>{t("risk")}:</b>{" "}
                {alert.risk_level}
              </p>

              <p>{alert.message}</p>

              <small>
                {alert.created_at
                  ? new Date(
                      alert.created_at
                    ).toLocaleString()
                  : ""}
              </small>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(
    Math.sqrt(a),
    Math.sqrt(1 - a)
  );

  return R * c;
}
function ShelterMap({ shelters }) {
  return (
    <MapContainer
      center={[20.2961, 85.8245]}
      zoom={9}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {shelters
        .filter(
          (s) =>
            s.latitude != null &&
            s.longitude != null
        )
        .map((shelter) => (
          <Marker
            key={shelter.id}
            position={[
              Number(shelter.latitude),
              Number(shelter.longitude)
            ]}
          >
            <Popup>
              <b>{shelter.name}</b>
              <br />
              📍 {shelter.location}
              <br />
              🏠 Capacity: {shelter.capacity}
              <br />
              Status: {shelter.status}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}

function Shelters() {
  const [shelters, setShelters] = useState([]);
  const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
  const [nearestShelter, setNearestShelter] = useState(null);
const [locationLoading, setLocationLoading] = useState(false);
  const { lang } = useLanguage();
  const t = (key) => getText(lang, key);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/shelters`)
      .then((res) => res.json())
      .then((result) => {
        setShelters(result.shelters || []);
      })
      .catch(() => {
        setShelters([]);
      });
  }, []);
  const filteredShelters = shelters.filter((shelter) => {
  const matchesSearch =
    shelter.name.toLowerCase().includes(search.toLowerCase()) ||
    shelter.location.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "All" ||
    shelter.status === statusFilter;

  return matchesSearch && matchesStatus;
});
const findNearestShelter = () => {
  setLocationLoading(true);

  if (!navigator.geolocation) {
    alert("Location is not supported by this browser.");
    setLocationLoading(false);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLon = position.coords.longitude;

      let nearest = null;
      let minDistance = Infinity;

      shelters.forEach((shelter) => {
        if (
          shelter.latitude != null &&
          shelter.longitude != null
        ) {
          const distance = getDistance(
            userLat,
            userLon,
            Number(shelter.latitude),
            Number(shelter.longitude)
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearest = {
              ...shelter,
              distance: distance.toFixed(2),
            };
          }
        }
      });

      setNearestShelter(nearest);
      setLocationLoading(false);

      if (!nearest) {
        alert("No shelter location available.");
      }
    },
    () => {
      alert("Please allow location access.");
      setLocationLoading(false);
    }
  );
};
 const bookShelter = async (shelterId) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  if (!token || !user) {
    alert(t("loginFirst"));
    navigate("/login");
    return;
  }

  const bookingData = {
    user_id: user.id,
    shelter_id: shelterId,
  };

  try {
    const res = await fetch(`${API}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(bookingData),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Booking failed");
      return;
    }

    alert(t("bookingSuccess"));
    navigate("/bookings");

  } catch (error) {
    // INTERNET OFF
    const offlineBookings = JSON.parse(
      localStorage.getItem("offlineBookings") || "[]"
    );

    const alreadySaved = offlineBookings.some(
      (booking) =>
        booking.user_id === user.id &&
        booking.shelter_id === shelterId
    );

    if (alreadySaved) {
      alert("This shelter is already saved for offline booking.");
      return;
    }

    offlineBookings.push({
      ...bookingData,
      savedAt: new Date().toISOString(),
      status: "Offline Pending",
    });

    localStorage.setItem(
      "offlineBookings",
      JSON.stringify(offlineBookings)
    );

    alert(
      "📴 Internet is OFF.\n\nYour shelter booking has been saved offline. It will sync automatically when internet is back."
    );
  }
};
  return (
    <div className="page">

      <PageHeading
        title={t("emergencyShelters")}
        subtitle={t("findShelters")}
      />
      <div className="card" style={{ marginBottom: "20px", textAlign: "center" }}>
  <h2>📍 Find Nearest Shelter</h2>

  <button
    className="btn primary"
    onClick={findNearestShelter}
    disabled={locationLoading}
  >
    {locationLoading
      ? "Finding shelter..."
      : "📍 Find Nearest Shelter"}
  </button>

  {nearestShelter && (
    <div style={{ marginTop: "15px" }}>
      <h3>🏠 {nearestShelter.name}</h3>
      <p>📍 {nearestShelter.location}</p>
      <p>📏 Distance: {nearestShelter.distance} km</p>
      <p>🟢 Status: {nearestShelter.status}</p>
      <a
  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestShelter.latitude},${nearestShelter.longitude}`}
  target="_blank"
  rel="noopener noreferrer"
  className="btn primary"
  style={{
    display: "inline-block",
    textDecoration: "none",
    marginTop: "10px",
  }}
>
  🧭 Get Directions
</a>
    </div>
  )}
</div>
     {shelters.length > 0 && (
  <div className="card" style={{ marginBottom: "20px" }}>
    <h2>🗺️ Shelter Map</h2>
    <ShelterMap shelters={shelters} />
  </div>
)}
<div className="card" style={{ marginBottom: "20px" }}>
  <h2>🔎 Search Shelters</h2>

  <input
    type="text"
    placeholder="Search by shelter name or location"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
  />

  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
  >
    <option value="All">All Status</option>
    <option value="Open">Open</option>
    <option value="Limited">Limited</option>
    <option value="Closed">Closed</option>
  </select>
  <p style={{ textAlign: "center" }}>
  Showing {filteredShelters.length} shelter(s)
</p>
</div>
      {shelters.length === 0 ? (
        <Empty text="No shelters available" />
      ) : (
        <div className="grid">

          {filteredShelters.map((shelter) => (
            <div className="card" key={shelter.id}>

              <h3>🏠 {shelter.name}</h3>

              <p>
                <b>{t("location")}:</b>{" "}
                {shelter.location}
              </p>

              <p>
                <b>{t("capacity")}:</b>{" "}
                {shelter.capacity}
              </p>
<p>
  🟢 Available: {shelter.available_capacity}
</p>
              <p>
                <b>{t("status")}:</b>{" "}
                {shelter.status}
              </p>
              <div className="shelter-resources">
  <p><b>Available Resources:</b></p>

  <span>🍱 Food</span>
  <span>💧 Water</span>
  <span>💊 Medicine</span>
  <span>🛏️ Beds</span>
</div>

              {shelter.status === "Open" ? (
                <button
                  className="btn primary"
                  onClick={() =>
                    bookShelter(shelter.id)
                  }
                >
                  🏠 {t("bookShelter")}
                </button>
              ) : (
                <button
                  className="btn"
                  disabled
                >
                  {shelter.status}
                </button>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
function Assistance() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [priorityType, setPriorityType] = useState("Normal");
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState(null);
const [audioURL, setAudioURL] = useState("");
const [isRecording, setIsRecording] = useState(false);
const [mediaRecorder, setMediaRecorder] = useState(null);
  const [medicine, setMedicine] = useState("");
  const [medicalProblem, setMedicalProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [sosMode, setSosMode] = useState(false);
  const [reportLocation, setReportLocation] = useState("");
const [issueType, setIssueType] = useState("Flooded Road");
const [reportDescription, setReportDescription] = useState("");
const [reportPhoto, setReportPhoto] = useState(null);

const [reportAudioBlob, setReportAudioBlob] = useState(null);
const [reportAudioURL, setReportAudioURL] = useState("");
const [reportMediaRecorder, setReportMediaRecorder] = useState(null);
const [reportIsRecording, setReportIsRecording] = useState(false);

const [reportLoading, setReportLoading] = useState(false);
const [myReports, setMyReports] = useState([]);
useEffect(() => {
  fetch(`${API}/api/blocked-area-reports`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
})
    .then((res) => res.json())
    .then((data) => {
      setMyReports(data.reports || []);
    })
    .catch(() => {
      setMyReports([]);
    });
}, []);
// Start voice recording
const startRecording = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Voice recording is not supported in this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });

      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioURL(url);

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  } catch (error) {
    alert("Please allow microphone access to record your voice.");
  }
};

// Stop voice recording
const stopRecording = () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  }
};

// Delete recorded audio
const deleteRecording = () => {
  if (audioURL) {
    URL.revokeObjectURL(audioURL);
  }

  setAudioBlob(null);
  setAudioURL("");
};
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert("Location is not supported by this browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      setLocation(`Latitude: ${lat}, Longitude: ${lon}`);
    },
    () => {
      alert("Please allow location access.");
    }
  );
};

// Start Blocked Area voice recording
const startReportRecording = async () => {
  try {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      alert("Voice recording is not supported in this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    const recorder = new MediaRecorder(stream);
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });

      const url = URL.createObjectURL(blob);

      setReportAudioBlob(blob);
      setReportAudioURL(url);

      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setReportMediaRecorder(recorder);
    setReportIsRecording(true);

  } catch (error) {
    alert("Please allow microphone access.");
  }
};

// Stop Blocked Area voice recording
const stopReportRecording = () => {
  if (
    reportMediaRecorder &&
    reportMediaRecorder.state === "recording"
  ) {
    reportMediaRecorder.stop();
    setReportIsRecording(false);
    setReportMediaRecorder(null);
  }
};

// Delete Blocked Area voice recording
const deleteReportRecording = () => {
  if (reportAudioURL) {
    URL.revokeObjectURL(reportAudioURL);
  }

  setReportAudioBlob(null);
  setReportAudioURL("");
};

const submitBlockedAreaReport = async (e) => {
  e.preventDefault();

  if (!reportLocation || !issueType) {
    alert("Please enter location and issue type");
    return;
  }

  setReportLoading(true);

  try {
    console.log("SELECTED PHOTO:", reportPhoto);
    const formData = new FormData();

    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("location", reportLocation);
    formData.append("issue_type", issueType);
    formData.append("description", reportDescription);

    if (reportPhoto) {
      formData.append("photo", reportPhoto);
    }
if (reportAudioBlob) {
  formData.append(
    "audio",
    reportAudioBlob,
    "blocked-area-voice.webm"
  );
}
   const res = await fetch(`${API}/api/blocked-area-reports`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
  body: formData,
});

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Report failed");
      return;
    }

    alert("🚧 Blocked area report submitted successfully!");

    setReportLocation("");
    setIssueType("Flooded Road");
    setReportDescription("");
    setReportPhoto(null);
if (reportAudioURL) {
  URL.revokeObjectURL(reportAudioURL);
}

setReportAudioBlob(null);
setReportAudioURL("");
  } catch (error) {
    alert("Cannot connect to backend");
  } finally {
    setReportLoading(false);
  }
};
  
const submitRequest = async (e) => {
  e.preventDefault();

  if (!name || !phone || !location || !type) {
    alert("Please fill all required fields");
    return;
  }

  setLoading(true);

  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();

    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("location", location);

    formData.append(
      "emergency_type",
      sosMode ? `SOS - ${type}` : type
    );

    formData.append(
      "message",
      type === "Medicine Request"
        ? sosMode
          ? `Medicine: ${medicine || "Not specified"} | Problem: ${medicalProblem || "Not specified"} | URGENT SOS REQUEST: ${message}`
          : `Medicine: ${medicine || "Not specified"} | Problem: ${medicalProblem || "Not specified"} | ${message}`
        : sosMode
        ? `URGENT SOS REQUEST: ${message}`
        : message
    );

    formData.append("priority_type", priorityType);

    // Attach voice recording
    if (audioBlob) {
      formData.append(
        "audio",
        audioBlob,
        "emergency-voice.webm"
      );
    }

    const res = await fetch(
      `${API}/api/emergency-requests`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: formData,
      }
    );

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Request failed");
      return;
    }

    const user = JSON.parse(
      localStorage.getItem("user") || "null"
    );

    if (user && result.request?.id) {
      const key = `floodflow_request_ids_${user.id}`;

      const oldIds = JSON.parse(
        localStorage.getItem(key) || "[]"
      );

      oldIds.push(result.request.id);

      localStorage.setItem(
        key,
        JSON.stringify([...new Set(oldIds)])
      );
    }

    alert(
      sosMode
        ? "🚨 SOS request submitted successfully!"
        : "Emergency request submitted successfully!"
    );

    setName("");
    setPhone("");
    setLocation("");
    setType("");
    setMessage("");
    setMedicine("");
    setMedicalProblem("");
    setPriorityType("Normal");
    setSosMode(false);

    // Clear voice recording after successful submission
    setAudioBlob(null);
    setAudioURL("");

    navigate("/requests");

  } catch (error) {
    console.error("Emergency request error:", error);
    alert("Cannot connect to backend");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="page">

      <PageHeading
        title="🚨 Emergency Assistance"
        subtitle="Request emergency help"
      />
      <div
  style={{
    maxWidth: "600px",
    margin: "0 auto 20px",
    padding: "18px",
    background: "#eef6ff",
    border: "2px solid #1976d2",
    borderRadius: "12px",
    textAlign: "center",
  }}
>
  <h2>📞 Emergency Helpline</h2>

  <p>For immediate emergency assistance, contact:</p>

  <a
    href="tel:112"
    className="btn primary"
    style={{
      display: "inline-block",
      textDecoration: "none",
    }}
  >
    📞 Call 112
  </a>
</div>
<div
  style={{
    maxWidth: "600px",
    margin: "0 auto 20px",
    padding: "18px",
    background: "#f5f5f5",
    border: "2px solid #ddd",
    borderRadius: "12px",
    textAlign: "center",
  }}
>
  <h2>🏥 Emergency Contacts</h2>

  <p>Quickly contact emergency services:</p>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "10px",
    }}
  >
    <a href="tel:112" className="btn primary">
      👮 Police
      <br />
      112
    </a>

    <a href="tel:108" className="btn primary">
      🚑 Ambulance
      <br />
      108
    </a>

    <a href="tel:101" className="btn primary">
      🚒 Fire
      <br />
      101
    </a>
  </div>
</div>
      {!sosMode && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "20px",
            background: "#fff1f1",
            border: "2px solid #d62828",
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <h2>🆘 Need Immediate Help?</h2>

          <p>
            Use SOS for urgent flood emergency situations.
          </p>

          <button
            type="button"
            onClick={() => setSosMode(true)}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "10px",
              background: "#d62828",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🚨 SOS — Need Immediate Help
          </button>
        </div>
      )}

      {sosMode && (
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto 20px",
            padding: "15px",
            background: "#ffe5e5",
            border: "2px solid #b00020",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "#b00020" }}>
            🚨 SOS MODE ACTIVE
          </h2>

          <p>
            Your request will be marked as an urgent SOS request.
          </p>
        </div>
      )}

      <form
        className="form-card"
        onSubmit={submitRequest}
      >

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
        />

        <input
          type="text"
          placeholder="Current Location"
          value={location}
          onChange={(e) =>
            setLocation(e.target.value)
          }
        />
        <select
  value={priorityType}
  onChange={(e) => setPriorityType(e.target.value)}
>
  <option value="Normal">👤 Normal</option>
  <option value="Child">👶 Child</option>
  <option value="Elderly">👴 Elderly</option>
  <option value="Disabled">♿ Disabled</option>
  <option value="Pregnant">🤰 Pregnant</option>
  <option value="Critical Medical">🩺 Critical Medical</option>
</select>
<button
  type="button"
  className="btn primary"
  onClick={getCurrentLocation}
>
  📍 Use My Current Location
</button>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value)
          }
        >
          <option value="">
            Select Emergency Type
          </option>

          <option value="Food Request">
            🍱 Food Request
          </option>

          <option value="Water Request">
            💧 Water Request
          </option>

          <option value="Medicine Request">
            💊 Medicine Request
          </option>

          <option value="Medical Emergency">
            🚑 Medical Emergency
          </option>

          <option value="Rescue Request">
            🛟 Rescue Request
          </option>

          <option value="Shelter Request">
            🏠 Shelter Request
          </option>
        </select>

        {type === "Medicine Request" && (
          <>
          <select
  value={medicalProblem}
  onChange={(e) =>
    setMedicalProblem(e.target.value)
  }
>
  <option value="">
    🤒 Select Disease / Problem
  </option>

  <option value="Fever">Fever</option>
  <option value="Cold / Cough">Cold / Cough</option>
  <option value="Headache">Headache</option>
  <option value="Stomach Problem">Stomach Problem</option>
  <option value="Diarrhea">Diarrhea</option>
  <option value="Vomiting">Vomiting</option>
  <option value="Body Pain">Body Pain</option>
  <option value="Allergy">Allergy</option>
  <option value="Injury / Wound">Injury / Wound</option>
  <option value="Breathing Problem">Breathing Problem</option>
  <option value="Other">Other</option>
</select>
           <select
  value={medicine}
  onChange={(e) =>
    setMedicine(e.target.value)
  }
>
  <option value="">
    💊 Select Medicine
  </option>

  <option value="Paracetamol">
    Paracetamol
  </option>

  <option value="ORS">
    ORS
  </option>

  <option value="Antiseptic Cream">
    Antiseptic Cream
  </option>

  <option value="Bandage">
    Bandage
  </option>

  <option value="Prescription Medicine">
    Prescription Medicine
  </option>

  <option value="Other">
    Other
  </option>
</select>

          
          </>
        )}

        <textarea
          placeholder="Describe your emergency"
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
        />
        {/* Voice Message Feature */}
<div className="voice-message-box">
  <h3>🎙️ Voice Emergency Message</h3>

  <p>Record your voice to describe your emergency.</p>

  {!isRecording ? (
    <button
      type="button"
      className="btn primary"
      onClick={startRecording}
    >
      🎙️ Start Recording
    </button>
  ) : (
    <button
      type="button"
      className="btn danger"
      onClick={stopRecording}
    >
      ⏹️ Stop Recording
    </button>
  )}

  {isRecording && (
    <p style={{ color: "red", fontWeight: "bold" }}>
      🔴 Recording in progress...
    </p>
  )}

  {audioURL && (
    <div style={{ marginTop: "15px" }}>
      <p>✅ Voice recording ready!</p>

      <audio
        controls
        src={audioURL}
        style={{ width: "100%" }}
      />

      <button
        type="button"
        className="btn danger"
        onClick={deleteRecording}
        style={{ marginTop: "10px" }}
      >
        🗑️ Delete Recording
      </button>
    </div>
  )}
</div>
<input
  type="file"
  accept="image/*"
 onChange={(e) => {
  const file = e.target.files[0] || null;
  setReportPhoto(file);
}}
  style={{
    width: "100%",
    marginTop: "12px",
  }}
/>

        <button
          type="submit"
          className="btn primary"
          disabled={loading}
        >
          {loading
            ? "Submitting..."
            : sosMode
            ? "🚨 Send SOS Request"
            : "🚨 Submit Request"}
        </button>

        {sosMode && (
          <button
            type="button"
            onClick={() => setSosMode(false)}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "10px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Cancel SOS
          </button>
        )}

      </form>
<div
  className="card"
  style={{
    marginTop: "25px",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    padding: "25px",
    borderRadius: "16px",
    border: "1px solid #dbeafe",
    background: "#ffffff",
    boxShadow: "0 6px 20px rgba(25, 118, 210, 0.12)",
  }}
>
  <h2 style={{ color: "#1976d2", textAlign: "center" }}>
    🚧 Report Flooded Road / Blocked Area
  </h2>

  <p style={{ textAlign: "center", color: "#666" }}>
    Help us identify unsafe roads and blocked areas.
  </p>

 <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  }}
>
  <input
    type="text"
    placeholder="Your Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
  />

  <input
    type="text"
    placeholder="Phone Number"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
</div>

 <input
  type="text"
  placeholder="Location of flooded / blocked area"
  value={reportLocation}
  onChange={(e) => setReportLocation(e.target.value)}
  style={{
    width: "100%",
    boxSizing: "border-box",
    marginTop: "12px",
    gridColumn: "1 / -1",
  }}
/>
  <select
    value={issueType}
    onChange={(e) => setIssueType(e.target.value)}
  >
    <option value="Flooded Road">🌊 Flooded Road</option>
    <option value="Blocked Road">🚧 Blocked Road</option>
    <option value="Bridge Blocked">🌉 Bridge Blocked</option>
    <option value="Waterlogging">💧 Waterlogging</option>
    <option value="Other">⚠️ Other</option>
  </select>

  <textarea
    placeholder="Describe the problem"
    value={reportDescription}
    onChange={(e) => setReportDescription(e.target.value)}
   style={{
  width: "100%",
  boxSizing: "border-box",
  minHeight: "100px",
  marginTop: "12px",
  gridColumn: "1 / -1",
  resize: "vertical",
}}
  />
<input
  type="file"
  accept="image/*"
  onChange={(e) => {
    setReportPhoto(e.target.files[0] || null);
  }}
  style={{
    width: "100%",
    marginTop: "12px",
  }}
/>
{/* Blocked Area Voice Recording */}
<div
  style={{
    marginTop: "15px",
    padding: "15px",
    border: "1px solid #90caf9",
    borderRadius: "10px",
    background: "#f5faff",
  }}
>
  <h3 style={{ color: "#1976d2" }}>
    🎙️ Voice Message (Optional)
  </h3>

  {reportIsRecording ? (
    <button
      type="button"
      className="btn primary"
      onClick={stopReportRecording}
    >
      ⏹️ Stop Recording
    </button>
  ) : (
    <button
      type="button"
      className="btn primary"
      onClick={startReportRecording}
    >
      🎙️ Record Voice Message
    </button>
  )}

  {reportAudioURL && (
    <div style={{ marginTop: "12px" }}>
      <audio
        controls
        src={reportAudioURL}
        style={{ width: "100%" }}
      />

      <button
        type="button"
        onClick={deleteReportRecording}
        style={{
          marginTop: "8px",
          padding: "8px 14px",
          background: "#e53935",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        🗑️ Delete Recording
      </button>
    </div>
  )}
</div>
  <button
  type="button"
  className="btn primary"
  onClick={submitBlockedAreaReport}
  disabled={reportLoading}
  style={{
    width: "100%",
    marginTop: "12px",
    boxSizing: "border-box",
  }}
>
    {reportLoading ? "Submitting..." : "🚧 Submit Flood Report"}
  </button>
</div>
<div
  className="card"
  style={{
    maxWidth: "600px",
    margin: "25px auto",
  }}
>
  <h2>📋 My Flood Reports</h2>

  {myReports.length === 0 ? (
    <p>No flood reports found.</p>
  ) : (
    myReports.map((report) => (
      <div
        key={report.id}
        style={{
          padding: "12px",
          marginBottom: "10px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h3>🚧 {report.issue_type}</h3>

        <p>
          <b>Location:</b> {report.location}
        </p>

        <p>
          <b>Description:</b>{" "}
          {report.description || "No description"}
        </p>
{report.photo_url && (
  <div style={{ marginTop: "10px" }}>
    <b>📸 Report Photo:</b>
    <br />
    <img
      src={`${API}${report.photo_url}`}
      alt="Flood report"
      style={{
        width: "100%",
        maxWidth: "350px",
        marginTop: "8px",
        borderRadius: "10px",
      }}
    />
  </div>
)}
        <p>
          <b>Status:</b>{" "}
          {report.status === "Accepted"
            ? "✅ Accepted"
            : report.status === "Rejected"
            ? "❌ Rejected"
            : "⏳ Pending"}
        </p>
      </div>
    ))
  )}
</div>
    </div>
  );
}
function Requests() {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const loadRequests = () => {
    fetch(`${API}/api/emergency-requests`)
      .then((res) => res.json())
      .then((result) => {
        let list = result.requests || [];

        if (user && user.role !== "Admin") {
          const key =
            `floodflow_request_ids_${user.id}`;

          const ids = JSON.parse(
            localStorage.getItem(key) || "[]"
          );

          list = list.filter((item) =>
            ids.includes(item.id)
          );
        }
const oldStatuses = JSON.parse(
  localStorage.getItem("floodflow_request_statuses") || "{}"
);

list.forEach((item) => {
  if (
    oldStatuses[item.id] &&
    oldStatuses[item.id] !== item.status
  ) {
    setNotification(
      `🔔 Request status updated to: ${item.status}`
    );
  }

  oldStatuses[item.id] = item.status;
});

localStorage.setItem(
  "floodflow_request_statuses",
  JSON.stringify(oldStatuses)
);
        setRequests(list);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const statusText = (status) => {
    if (status === "Completed") return "📦 Delivered";
    if (status === "In Progress") return "🔄 In Progress";
    if (status === "Accepted") return "✅ Accepted";
    if (status === "Rejected") return "❌ Rejected";
    return "⏳ Pending";
  };

  if (!user) {
    return (
      <div className="page">
        {notification && (
  <div
    style={{
      maxWidth: "600px",
      margin: "0 auto 20px",
      padding: "15px",
      background: "#e8f5e9",
      border: "2px solid #43a047",
      borderRadius: "10px",
      textAlign: "center",
      fontWeight: "bold",
    }}
  >
    {notification}
  </div>
)}
        <h2>Login Required</h2>
        <p>Please login to view your requests.</p>
      </div>
    );
  }

  return (
    <div className="page">

      <PageHeading
        title="📋 My Requests"
        subtitle="Track your emergency requests"
      />
      {showHistory && (
  <div className="card" style={{ marginBottom: "20px" }}>
    <h2>🕘 Emergency History</h2>

    {requests.length === 0 ? (
      <p>No emergency history found.</p>
    ) : (
      requests.map((request) => (
        <div
          key={request.id}
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderBottom: "1px solid #ddd",
          }}
        >
          <b>🚨 {request.emergency_type}</b>
          <p>Status: {request.status}</p>
          <p>Location: {request.location}</p>
          <small>
            {new Date(request.created_at).toLocaleString()}
          </small>
        </div>
      ))
    )}
  </div>
)}
<div style={{ textAlign: "center", marginBottom: "20px" }}>
  <button
    className="btn primary"
    onClick={() => setShowHistory(!showHistory)}
  >
    🕘 {showHistory ? "Hide History" : "Emergency History"}
  </button>
</div>
      {loading ? (
        <Loading />
      ) : requests.length === 0 ? (
        <Empty text="No requests found" />
      ) : (
        <div className="grid">

          {requests.map((item) => (
            <div className="card" key={item.id}>

              <h3>
                🚨 {item.emergency_type}
              </h3>

              <p>
                <b>Name:</b> {item.name}
              </p>

              <p>
                <b>Phone:</b> {item.phone}
              </p>

              <p>
                <b>Location:</b> {item.location}
              </p>
<p>
  <b>Priority:</b> {item.priority_type || "Normal"}
</p>
              <p>
                <b>Description:</b>{" "}
                {item.message || "No description"}
              </p>

              <p>
                <b>Status:</b>{" "}
                {statusText(item.status)}
              </p>

              <small>
                {item.created_at
                  ? new Date(
                      item.created_at
                    ).toLocaleString()
                  : ""}
              </small>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`${API}/api/bookings/user/${user.id}`, {
      headers: {
        Authorization:
          `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        setBookings(result.bookings || []);
      })
      .catch(() => {
        setBookings([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (!user) {
    return (
      <div className="page">
        <h2>Login Required</h2>
        <p>Please login to view your bookings.</p>
      </div>
    );
  }

  return (
    <div className="page">

      <PageHeading
        title="🏠 My Bookings"
        subtitle="View your shelter bookings"
      />

      {loading ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <Empty text="No bookings found" />
      ) : (
        <div className="grid">

          {bookings.map((booking) => (
            <div
              className="card"
              key={booking.id}
            >

              <h3>
                🏠 {booking.shelter_name ||
                  "Emergency Shelter"}
              </h3>

              <p>
                <b>Booking ID:</b>{" "}
                {booking.id}
              </p>

              <p>
                <b>Location:</b>{" "}
                {booking.location || "N/A"}
              </p>

              <p>
                <b>Status:</b>{" "}
                {booking.status}
              </p>

              <small>
                {booking.created_at
                  ? new Date(
                      booking.created_at
                    ).toLocaleString()
                  : ""}
              </small>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
const [showForgot, setShowForgot] = useState(false);
const [forgotEmail, setForgotEmail] = useState("");
const [otp, setOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const loginUser = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await res.json();

     if (!res.ok) {
  alert(result.message + "\n" + (result.error || ""));
  return;
}

      localStorage.setItem("token", result.token);
      localStorage.setItem(
        "user",
        JSON.stringify(result.user)
      );

      alert("Login successful!");

      if (
        result.user.role?.toLowerCase() === "admin"
      ) {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      alert("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };
const forgotPassword = async () => {
  if (!forgotEmail) {
    alert("Please enter your email");
    return;
  }

  try {
    const res = await fetch(`${API}/api/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: forgotEmail }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message);
      return;
    }

    alert("OTP generated. Check backend terminal.");
  } catch (error) {
    alert("Cannot connect to backend");
  }
};

const resetPassword = async () => {
  if (!forgotEmail || !otp || !newPassword) {
    alert("Please fill all fields");
    return;
  }

  try {
    const res = await fetch(`${API}/api/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: forgotEmail,
        otp,
        newPassword,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.message);
      return;
    }

    alert("Password reset successfully!");

    setShowForgot(false);
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
  } catch (error) {
    alert("Cannot connect to backend");
  }
};
  return (
    <div className="auth-page">

      <form
        className="form-card"
        onSubmit={loginUser}
      >

        <h2>🔐 Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />
<p
  onClick={() => setShowForgot(true)}
  style={{
    color: "#1976d2",
    cursor: "pointer",
    textAlign: "right",
    marginTop: "8px",
  }}
>
  Forgot Password?
</p>
{showForgot && (
  <>
    <input
      type="email"
      placeholder="Enter your email"
      value={forgotEmail}
      onChange={(e) => setForgotEmail(e.target.value)}
    />

    <button
      type="button"
      className="btn primary"
      onClick={forgotPassword}
    >
      Send OTP
    </button>

    <input
      type="text"
      placeholder="Enter OTP"
      value={otp}
      onChange={(e) => setOtp(e.target.value)}
    />

    <input
      type="password"
      placeholder="New Password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
    />

    <button
      type="button"
      className="btn primary"
      onClick={resetPassword}
    >
      Reset Password
    </button>
  </>
)}
        <button
          type="submit"
          className="btn primary"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>

      </form>

    </div>
  );
}
function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const registerUser = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Registration failed");
        return;
      }

      alert("Registration successful!");
      navigate("/login");

    } catch (error) {
      alert("Cannot connect to backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <form
        className="form-card"
        onSubmit={registerUser}
      >

        <h2>📝 Register</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <button
          type="submit"
          className="btn primary"
          disabled={loading}
        >
          {loading
            ? "Registering..."
            : "Register"}
        </button>

        <p>
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>

      </form>

    </div>
  );
}
function Dashboard() {
  const navigate = useNavigate();
  const [requestCount, setRequestCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

useEffect(() => {
  fetch(`${API}/api/emergency-requests`)
    .then((res) => res.json())
    .then((result) => {
      setRequestCount((result.requests || []).length);
    });
}, []);
useEffect(() => {
  fetch(`${API}/api/bookings`)
    .then((res) => res.json())
    .then((result) => {
      setBookingCount((result.bookings || []).length);
    });
}, []);
useEffect(() => {
  fetch(`${API}/api/flood-alerts`)
    .then((res) => res.json())
    .then((result) => {
      setAlertCount((result.alerts || []).length);
    });
}, []);
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  if (!user) {
    return (
      <div className="page">
        <h2>🔐 Login Required</h2>
        <button
          className="btn primary"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </div>
    );
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="page">
      <div className="grid">

  <div className="card">
    <h2>🚨</h2>
    <h3>Emergency Requests</h3>
    <p>Total Requests: <b>{requestCount}</b></p>
  </div>

  <div className="card">
    <h2>🏠</h2>
    <h3>Shelter Bookings</h3>
    <p>Total Bookings: <b>{bookingCount}</b></p>
  </div>

  <div className="card">
    <h2>⚠️</h2>
    <h3>Flood Alerts</h3>
    <p>Total Alerts: <b>{alertCount}</b></p>
  </div>

</div>

      <PageHeading
        title="📊 Dashboard"
        subtitle="FloodFlow User Dashboard"
      />

      <div className="card profile-card">

        <h2>👋 Welcome, {user.name}</h2>

        <p>
          <b>Email:</b> {user.email}
        </p>

        <p>
          <b>Role:</b> {user.role}
        </p>

      </div>

      <div className="grid">

        <div
          className="card action-card"
          onClick={() => navigate("/alerts")}
        >
          <h2>⚠️</h2>
          <h3>Flood Alerts</h3>
          <p>Check current flood conditions.</p>
        </div>

        <div
          className="card action-card"
          onClick={() => navigate("/shelters")}
        >
          <h2>🏠</h2>
          <h3>Find Shelter</h3>
          <p>View and book emergency shelters.</p>
        </div>

        <div
          className="card action-card"
          onClick={() => navigate("/assistance")}
        >
          <h2>🚨</h2>
          <h3>Emergency Help</h3>
          <p>Request food, water, medicine or rescue.</p>
        </div>

        <div
          className="card action-card"
          onClick={() => navigate("/requests")}
        >
          <h2>📋</h2>
          <h3>My Requests</h3>
          <p>Track your emergency request status.</p>
        </div>

        <div
          className="card action-card"
          onClick={() => navigate("/bookings")}
        >
          <h2>🏡</h2>
          <h3>My Bookings</h3>
          <p>View your shelter bookings.</p>
        </div>

      </div>

      {user.role === "Admin" && (
        <button
          className="btn primary"
          onClick={() => navigate("/admin")}
        >
          ⚙️ Open Admin Panel
        </button>
      )}

      <br />

      <button
        className="btn danger"
        onClick={logout}
      >
        Logout
      </button>

    </div>
  );
}
function Admin() {
  const [requests, setRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [blockedReports, setBlockedReports] = useState([]);
  const [newBookingAlert, setNewBookingAlert] = useState(false);
const [blockedLoading, setBlockedLoading] = useState(true);
  const [filter, setFilter] = useState("All");
const [auditLogs, setAuditLogs] = useState([]);
const [auditLoading, setAuditLoading] = useState(true);
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const loadRequests = () => {
    fetch(`${API}/api/emergency-requests`)
      .then((res) => res.json())
      .then((result) => {
        setRequests(result.requests || []);
      })
      .catch(() => {
        setRequests([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadBookings = () => {
    fetch(`${API}/api/bookings`)
      .then((res) => res.json())
      .then((result) => {
  const data = result.bookings || [];
  setBookings(data);

  const hasPending = data.some(
    (booking) => booking.status === "Pending"
  );

  setNewBookingAlert(hasPending);
})
      .catch(() => {
        setBookings([]);
      })
      .finally(() => {
        setBookingLoading(false);
      });
  };
const loadBlockedReports = () => {
  fetch(`${API}/api/blocked-area-reports`, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  },
})
    .then((res) => res.json())
    .then((result) => {
      setBlockedReports(result.reports || []);
    })
    .catch(() => {
      setBlockedReports([]);
    })
    .finally(() => {
      setBlockedLoading(false);
    });
};
const loadAuditLogs = () => {
  fetch(`${API}/api/audit-logs`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  })
    .then((res) => res.json())
    .then((result) => {
      setAuditLogs(result.logs || []);
    })
    .catch(() => {
      setAuditLogs([]);
    })
    .finally(() => {
      setAuditLoading(false);
    });
};
 useEffect(() => {
  loadRequests();
  loadBookings();
  loadBlockedReports();
  loadAuditLogs();
}, []);
  const updateRequestStatus = async (id, status) => {
    try {
      const res = await fetch(
        `${API}/api/emergency-requests/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Status update failed");
        return;
      }

      alert("Status updated successfully");

setRequests((prev) =>
  prev.map((item) =>
    item.id === id
      ? { ...item, status: status }
      : item
  )
);

setFilter(status);
    } catch (error) {
      alert("Cannot connect to backend");
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(
        `${API}/api/bookings/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ status }),
        }
      );
const updateBlockedReportStatus = async (id, status) => {
  try {
    const res = await fetch(
      `${API}/api/blocked-area-reports/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Status update failed");
      return;
    }

    alert(
      status === "Accepted"
        ? "Report accepted successfully!"
        : "Report rejected successfully!"
    );

    loadBlockedReports();

  } catch (error) {
    alert("Cannot connect to backend");
  }
};
      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Booking status update failed");
        return;
      }
alert("Status updated successfully");
loadRequests();
      alert(
        status === "Accepted"
          ? "Booking accepted successfully!"
          : "Booking rejected successfully!"
      );

      loadBookings();

    } catch (error) {
      alert("Cannot connect to backend");
    }
  };
const updateBlockedReportStatus = async (id, status) => {
  try {
    const res = await fetch(
      `${API}/api/blocked-area-reports/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      alert(result.message || "Status update failed");
      return;
    }

    alert(
      status === "Accepted"
        ? "Report accepted successfully!"
        : "Report rejected successfully!"
    );

    loadBlockedReports();
  } catch (error) {
    alert("Cannot connect to backend");
  }
};
  if (!user || user.role !== "Admin") {
    return (
      <div className="page">
        <h2>Access Denied</h2>
        <p>Only admin can access this page.</p>
      </div>
    );
  }

  const filtered =
    filter === "All"
      ? requests
      : requests.filter(
          (item) => item.status === filter
        );

  return (
    <div className="page">

      <PageHeading
        title="⚙️ Admin Dashboard"
        subtitle="Manage emergency requests and shelter bookings"
      />
{newBookingAlert && (
  <div
    style={{
      padding: "14px",
      margin: "15px 0",
      borderRadius: "10px",
      background: "#fff3cd",
      border: "1px solid #ffe69c",
      color: "#664d03",
      fontWeight: "600",
    }}
  >
    🔔 New shelter booking received. Please check Shelter Bookings.
  </div>
)}
      <h2 style={{ marginBottom: "20px" }}>
        🚨 Emergency Requests
      </h2>

      <div className="filters">

        {[
          "All",
          "Pending",
          "Accepted",
          "In Progress",
          "Completed",
          "Rejected",
        ].map((item) => (
          <button
            key={item}
            className="btn"
            onClick={() => setFilter(item)}
          >
            {item === "Completed"
              ? "Delivered"
              : item}
          </button>
        ))}

      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text="No requests found" />
      ) : (
        <div className="grid">

          {filtered.map((item) => (
            <div
              className="card"
              key={item.id}
            >

              <h3>
                🚨 {item.emergency_type}
              </h3>

              <p>
                <b>Request ID:</b> {item.id}
              </p>

              <p>
                <b>User:</b> {item.name}
              </p>

              <p>
                <b>Phone:</b> {item.phone}
              </p>

              <p>
                <b>Location:</b> {item.location}
              </p>

              <p>
                <b>Description:</b>{" "}
                {item.message || "No description"}
              </p>
              
{item.audio_url && (
  <div style={{ margin: "15px 0" }}>
    <p>
      <b>🎙️ Voice Message:</b>
    </p>

    <audio
      controls
      preload="none"
      src={`${API}${item.audio_url}`}
      style={{ width: "100%" }}
    >
      Your browser does not support audio playback.
    </audio>
  </div>
)}

<p>
  <b>Priority:</b> {item.priority_type || "Normal"}
</p>
              <p>
                <b>Date:</b>{" "}
                {item.created_at
                  ? new Date(
                      item.created_at
                    ).toLocaleString()
                  : ""}
              </p>

              <p>
                <b>Status:</b>{" "}
                {item.status === "Completed"
                  ? "📦 Delivered"
                  : item.status}
              </p>

              <div className="admin-actions">

                {item.status === "Pending" && (
                  <>
                    <button
                      className="btn primary"
                      onClick={() =>
                        updateRequestStatus(
                          item.id,
                          "Accepted"
                        )
                      }
                    >
                      ✅ Accept
                    </button>

                    <button
                      className="btn danger"
                      onClick={() =>
                        updateRequestStatus(
                          item.id,
                          "Rejected"
                        )
                      }
                    >
                      ❌ Reject
                    </button>
                  </>
                )}

                {item.status === "Accepted" && (
                  <button
                    className="btn primary"
                    onClick={() =>
                      updateRequestStatus(
                        item.id,
                        "In Progress"
                      )
                    }
                  >
                    🔄 In Progress
                  </button>
                )}

                {item.status === "In Progress" && (
                  <button
                    className="btn primary"
                    onClick={() =>
                      updateRequestStatus(
                        item.id,
                        "Completed"
                      )
                    }
                  >
                    📦 Delivered
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

      <h2 style={{ marginTop: "50px", marginBottom: "20px" }}>
        🏠 Shelter Bookings
      </h2>

      {bookingLoading ? (
        <Loading />
      ) : bookings.length === 0 ? (
        <Empty text="No shelter bookings found" />
      ) : (
        <div className="grid">

          {bookings.map((booking) => (
            <div
              className="card"
              key={booking.id}
            >

              <h3>
                🏠 {booking.shelter_name || "Emergency Shelter"}
              </h3>

              <p>
                <b>Booking ID:</b>{" "}
                {booking.id}
              </p>

              <p>
                <b>User:</b>{" "}
                {booking.user_name || "N/A"}
              </p>

              <p>
                <b>Email:</b>{" "}
                {booking.user_email || "N/A"}
              </p>

              <p>
                <b>Location:</b>{" "}
                {booking.location || "N/A"}
              </p>

              <p>
                <b>Status:</b>{" "}
                {booking.status || "Pending"}
              </p>

              <p>
                <b>Date:</b>{" "}
                {booking.created_at
                  ? new Date(
                      booking.created_at
                    ).toLocaleString()
                  : ""}
              </p>

              {booking.status === "Pending" && (
                <div className="admin-actions">

                  <button
                    className="btn primary"
                    onClick={() =>
                      updateBookingStatus(
                        booking.id,
                        "Accepted"
                      )
                    }
                  >
                    ✅ Accept
                  </button>

                  <button
                    className="btn danger"
                    onClick={() =>
                      updateBookingStatus(
                        booking.id,
                        "Rejected"
                      )
                    }
                  >
                    ❌ Reject
                  </button>

                </div>
              )}

              {booking.status === "Accepted" && (
                <p>
                  <b>Booking:</b> ✅ Accepted
                </p>
              )}

              {booking.status === "Rejected" && (
                <p>
                  <b>Booking:</b> ❌ Rejected
                </p>
              )}

            </div>
          ))}

        </div>
      )}
      <h2 style={{ marginTop: "50px", marginBottom: "20px" }}>
  🔐 Cloud Compliance - Audit Logs
</h2>

{auditLoading ? (
  <Loading />
) : auditLogs.length === 0 ? (
  <Empty text="No activity logs found" />
) : (
  <div className="grid">
    {auditLogs.map((log) => (
      <div className="card" key={log.id}>
        <h3>📋 {log.action}</h3>

        <p><b>User:</b> {log.user_email || "N/A"}</p>
        <p><b>Module:</b> {log.module || "N/A"}</p>
        <p><b>Details:</b> {log.details || "N/A"}</p>
        <p><b>IP Address:</b> {log.ip_address || "N/A"}</p>
        <p>
          <b>Date:</b>{" "}
          {log.created_at
            ? new Date(log.created_at).toLocaleString()
            : "N/A"}
        </p>
      </div>
    ))}
  </div>
)}
<h2 style={{ marginTop: "50px", marginBottom: "20px" }}>
  🚧 Blocked Area Reports
</h2>
{blockedLoading ? (
  <Loading />
) : blockedReports.length === 0 ? (
  <Empty text="No blocked area reports found" />
) : (
  <div className="grid">
    {blockedReports.map((report) => (
      <div className="card" key={report.id}>
        <h3>🚧 {report.issue_type}</h3>

        <p><b>Name:</b> {report.name || "N/A"}</p>
        <p><b>Phone:</b> {report.phone || "N/A"}</p>
        <p><b>Location:</b> {report.location}</p>
        <p><b>Description:</b> {report.description || "No description"}</p>
        {report.photo_url && (
  <div style={{ marginTop: "12px" }}>
    <b>📸 Report Photo:</b>
    <br />
    <img
      src={`${API}${report.photo_url}`}
      alt="Flood report"
      style={{
        width: "100%",
        maxWidth: "400px",
        marginTop: "8px",
        borderRadius: "10px",
      }}
    />
  </div>
)}
        <p><b>Status:</b> {report.status}</p>
        {report.status === "Pending" && (
  <div className="admin-actions">

    <button
      className="btn primary"
      onClick={() =>
        updateBlockedReportStatus(
          report.id,
          "Accepted"
        )
      }
    >
      ✅ Accept
    </button>

    <button
      className="btn danger"
      onClick={() =>
        updateBlockedReportStatus(
          report.id,
          "Rejected"
        )
      }
    >
      ❌ Reject
    </button>

  </div>
)}
      </div>
    ))}
  </div>
)}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>

        <Routes>

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/shelters"
            element={<Shelters />}
          />

          <Route
            path="/assistance"
            element={<Assistance />}
          />

          <Route
            path="/requests"
            element={<Requests />}
          />

          <Route
            path="/bookings"
            element={<Bookings />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/admin"
            element={<Admin />}
          />

        </Routes>

      </Layout>
    </BrowserRouter>
  );
}

export default App;
