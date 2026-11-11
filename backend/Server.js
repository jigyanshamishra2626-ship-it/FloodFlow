const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const multer = require("multer");

dotenv.config();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

const app = express();
const PORT = process.env.PORT || 5000;


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// ===============================
// DATABASE CONNECTION
// ===============================

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.connect()
  .then((client) => {
    console.log("PostgreSQL connected successfully!");
    client.release();
  })
  .catch((error) => {
    console.error(
      "PostgreSQL connection error:",
      error.message
    );
  });

// ===============================
// CLOUD COMPLIANCE MIDDLEWARE
// ===============================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Token required."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token."
    });
  }
};


// ADMIN ACCESS CONTROL

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only."
    });
  }

  next();
};


// AUDIT LOG FUNCTION

const saveAuditLog = async (
  user,
  action,
  module,
  details,
  ip
) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs
       (user_id, user_email, action, module, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        user?.id || null,
        user?.email || null,
        action,
        module,
        details || "",
        ip || ""
      ]
    );

  } catch (error) {
    console.error("Audit log error:", error.message);
  }
};
// ===============================
// BASIC ROUTE
// ===============================

app.get("/", (req, res) => {
  res.json({
    message: "FloodFlow backend is running successfully!",
  });
});


// ===============================
// TEST DATABASE
// ===============================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully!",
      time: result.rows[0].now,
    });

  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      message: "Database connection failed.",
      error: error.message,
    });
  }
});


// ===============================
// REGISTER
// ===============================

app.post("/api/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        message: "User with this email already exists.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users
       (name, email, password, role)
       VALUES ($1, $2, $3, 'User')
       RETURNING id, name, email, role`,
      [
        name,
        email,
        hashedPassword,
      ]
    );

    res.status(201).json({
      message: "Registration successful!",
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed.",
      error: error.message,
    });
  }
});


// ===============================
// LOGIN
// ===============================

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
await saveAuditLog(
  user,
  "USER_LOGIN",
  "Authentication",
  "User logged in successfully",
  req.ip
);
    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed.",
      error: error.message,
    });
  }
});


// ===============================
// FORGOT PASSWORD
// ===============================

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const result = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Email not registered.",
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    await pool.query(
      `UPDATE users
       SET reset_otp = $1,
           reset_otp_expires =
             NOW() + INTERVAL '10 minutes'
       WHERE email = $2`,
      [otp, email]
    );

    console.log(
      "PASSWORD RESET OTP:",
      otp
    );

    res.json({
      message: "OTP generated successfully.",
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      message: "Failed to generate OTP.",
    });
  }
});


// ===============================
// RESET PASSWORD
// ===============================

app.post("/api/reset-password", async (req, res) => {
  try {
    const {
      email,
      otp,
      newPassword,
    } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message:
          "Email, OTP and new password are required.",
      });
    }

    const result = await pool.query(
      `SELECT id
       FROM users
       WHERE email = $1
       AND reset_otp = $2
       AND reset_otp_expires > NOW()`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid or expired OTP.",
      });
    }

    const hashedPassword =
      await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
       SET password = $1,
           reset_otp = NULL,
           reset_otp_expires = NULL
       WHERE email = $2`,
      [hashedPassword, email]
    );

    res.json({
      message: "Password reset successfully!",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      message: "Failed to reset password.",
    });
  }
});


// ===============================
// AUTOMATIC WEATHER RISK
// ===============================

app.get("/api/weather-risk", async (req, res) => {
  try {
    const latitude = 20.2961;
    const longitude = 85.8245;

  const weatherResponse = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=rain,precipitation&timezone=Asia%2FKolkata`
);
    const weather =
      await weatherResponse.json();

    const rain =
      Number(weather.current?.rain || 0);

    let riskLevel;
    let message;

    if (rain >= 15) {
      riskLevel = "High";
      message =
        "Heavy rainfall detected. Please stay alert and move to a safe shelter if required.";

    } else if (rain >= 5) {
      riskLevel = "Medium";
      message =
        "Moderate rainfall detected. Please stay alert and monitor flood conditions.";

    } else {
      riskLevel = "Low";
      message =
        "Low rainfall detected. Current rainfall risk is low.";
    }

    res.json({
      location: "Bhubaneswar",
      rainfall_mm: rain,
      risk_level: riskLevel,
      message: message,
    });

  } catch (error) {
    console.error(
      "Weather risk error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch weather data.",
      error: error.message,
    });
  }
});
app.get("/api/weather-search", async (req, res) => {
  try {
    const { location } = req.query;

    if (!location) {
      return res.status(400).json({
        message: "Location is required.",
      });
    }

    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=10&language=en&format=json`
    );

    const geoData = await geoResponse.json();
console.log("GEO DATA:", geoData);
    if (!geoData.results || geoData.results.length === 0) {
      return res.status(404).json({
        message: "Location not found.",
      });
    }

    const place = geoData.results[0];

   const weatherResponse = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,rain,precipitation,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&forecast_days=5&timezone=auto`
);

    const weather = await weatherResponse.json();
console.log("WEATHER DATA:", weather);
    const rain = Number(weather.current?.rain || 0);

    let risk = "Low";

    if (rain >= 15) {
      risk = "High";
    } else if (rain >= 5) {
      risk = "Medium";
    }

    res.json({
      location: place.name,
      country: place.country,
      temperature: weather.current?.temperature_2m,
      humidity: weather.current?.relative_humidity_2m,
      rainfall: rain,
      risk: risk,
      weather_code: weather.current?.weather_code,
      forecast: weather.daily?.time?.map((date, index) => ({
  date,
  max: weather.daily.temperature_2m_max[index],
  min: weather.daily.temperature_2m_min[index],
  rainfall: weather.daily.precipitation_sum[index],
  rain_probability:
    weather.daily.precipitation_probability_max[index],
  weather_code: weather.daily.weather_code[index],
})) || [],
    });

  } catch (error) {
    console.error("Weather search error:", error);

    res.status(500).json({
      message: "Failed to fetch weather.",
    });
  }
});

// ===============================
// FLOOD ALERTS
// ===============================

app.get("/api/flood-alerts", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM flood_alerts
       ORDER BY created_at DESC`
    );

    res.json({
      alerts: result.rows,
    });

  } catch (error) {
    console.error(
      "Get alerts error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch flood alerts.",
      error: error.message,
    });
  }
});


app.post("/api/flood-alerts", async (req, res) => {
  try {
    const {
      location,
      risk_level,
      message,
    } = req.body;

    if (
      !location ||
      !risk_level ||
      !message
    ) {
      return res.status(400).json({
        message:
          "Location, risk level and message are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO flood_alerts
       (location, risk_level, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        location,
        risk_level,
        message,
      ]
    );

    res.status(201).json({
      message:
        "Flood alert added successfully!",
      alert: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Add alert error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to add flood alert.",
      error: error.message,
    });
  }
});


app.delete("/api/flood-alerts/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM flood_alerts
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Flood alert not found.",
      });
    }

    res.json({
      message:
        "Flood alert deleted successfully!",
    });

  } catch (error) {
    console.error(
      "Delete alert error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete flood alert.",
      error: error.message,
    });
  }
});


// ===============================
// SHELTERS
// ===============================

app.get("/api/shelters", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM shelters
       ORDER BY created_at DESC`
    );

    res.json({
      shelters: result.rows,
    });

  } catch (error) {
    console.error(
      "Get shelters error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch shelters.",
      error: error.message,
    });
  }
});


app.post("/api/shelters", async (req, res) => {
  try {
    const {
      name,
      location,
      capacity,
      status,
    } = req.body;

    if (
      !name ||
      !location ||
      !capacity
    ) {
      return res.status(400).json({
        message:
          "Name, location and capacity are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO shelters
       (name, location, capacity, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        name,
        location,
        capacity,
        status || "Open",
      ]
    );

    res.status(201).json({
      message:
        "Shelter added successfully!",
      shelter: result.rows[0],
    });

  } catch (error) {
    console.error(
      "Add shelter error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to add shelter.",
      error: error.message,
    });
  }
});


app.delete("/api/shelters/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM shelters
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Shelter not found.",
      });
    }

    res.json({
      message:
        "Shelter deleted successfully!",
    });

  } catch (error) {
    console.error(
      "Delete shelter error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete shelter.",
      error: error.message,
    });
  }
});


// ===============================
// EMERGENCY REQUESTS
// ===============================


app.post(
  "/api/emergency-requests",
  upload.single("audio"),
  async (req, res) => {
    try {
      const {
        name,
        phone,
        location,
        emergency_type,
        message,
        priority_type,
      } = req.body;

      if (!name || !phone || !location || !emergency_type) {
        return res.status(400).json({
          message: "Name, phone, location and emergency type are required.",
        });
      }

      const audio_url = req.file
        ? `/uploads/${req.file.filename}`
        : null;

      const result = await pool.query(
        `INSERT INTO emergency_requests
         (name, phone, location, emergency_type, message, priority_type, audio_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          name,
          phone,
          location,
          emergency_type,
          message || "",
          priority_type || "Normal",
          audio_url,
        ]
      );

      res.status(201).json({
        message: "Emergency request submitted successfully!",
        request: result.rows[0],
      });

    } catch (error) {
      console.error("Create emergency request error:", error);

      res.status(500).json({
        message: "Failed to submit emergency request.",
        error: error.message,
      });
    }
  }
);


app.get("/api/emergency-requests", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM emergency_requests
       ORDER BY created_at DESC`
    );

    res.json({
      requests: result.rows,
    });

  } catch (error) {
    console.error(
      "Get emergency requests error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to fetch emergency requests.",
      error: error.message,
    });
  }
});


app.put(
  "/api/emergency-requests/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          message: "Status is required.",
        });
      }

      const allowedStatuses = [
        "Pending",
        "Accepted",
        "In Progress",
        "Completed",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status.",
        });
      }

      const result = await pool.query(
        `UPDATE emergency_requests
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Request not found.",
        });
      }

      res.json({
        message:
          "Request status updated successfully!",
        request: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Update request status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update request status.",
        error: error.message,
      });
    }
  }
);
// ===============================
// BLOCKED AREA REPORTS
// ===============================


app.post(
  "/api/blocked-area-reports",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        name,
        phone,
        location,
        issue_type,
        description,
      } = req.body || {};

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      let userId = null;

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "floodflow_secret"
          );

          userId = decoded.id;
        } catch (error) {
          console.log("Invalid token");
        }
      }

      const photo_url = req.files?.photo?.[0]
        ? `/uploads/${req.files.photo[0].filename}`
        : null;

      const audio_url = req.files?.audio?.[0]
        ? `/uploads/${req.files.audio[0].filename}`
        : null;

      const result = await pool.query(
        `INSERT INTO blocked_area_reports
         (user_id, name, phone, location, issue_type, description, photo_url, audio_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          userId,
          name,
          phone,
          location,
          issue_type,
          description || "",
          photo_url,
          audio_url,
        ]
      );

      res.status(201).json({
        message: "Blocked area report submitted successfully!",
        report: result.rows[0],
      });

    } catch (error) {
      console.error("Blocked area report error:", error);

      res.status(500).json({
        message: "Failed to submit blocked area report.",
        error: error.message,
      });
    }
  }
);


// Get blocked area reports

app.get(
  "/api/blocked-area-reports",
  async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      let userId = null;
      let role = null;

      if (token) {
        try {
          const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "floodflow_secret"
          );

          userId = decoded.id;
          role = decoded.role;
        } catch (error) {
          console.log("Invalid token");
        }
      }

      let result;

      if (role === "Admin") {
        result = await pool.query(
          `SELECT *
           FROM blocked_area_reports
           ORDER BY id DESC`
        );
      } else {
        result = await pool.query(
          `SELECT *
           FROM blocked_area_reports
           WHERE user_id = $1
           ORDER BY id DESC`,
          [userId]
        );
      }

      res.json({
        reports: result.rows,
      });

    } catch (error) {
      console.error(
        "Blocked area reports error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch blocked area reports.",
      });
    }
  }
);

// Accept / Reject blocked area report

app.put(
  "/api/blocked-area-reports/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (
        !["Accepted", "Rejected"].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid status.",
        });
      }

      const result = await pool.query(
        `UPDATE blocked_area_reports
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Report not found.",
        });
      }

      res.json({
        message:
          `Report ${status.toLowerCase()} successfully!`,
        report: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Update blocked report error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update report.",
      });
    }
  }
);


// ===============================
// SHELTER BOOKING
// ===============================


// Create shelter booking

app.post(
  "/api/bookings",
  async (req, res) => {
    try {
      const {
        user_id,
        shelter_id,
      } = req.body;

      if (!user_id || !shelter_id) {
        return res.status(400).json({
          message:
            "User ID and Shelter ID are required.",
        });
      }

      // Check user

      const userCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1",
        [user_id]
      );

      if (userCheck.rows.length === 0) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      // Check shelter

      const shelterCheck = await pool.query(
        `SELECT
           id,
           name,
           location,
           capacity,
           status
         FROM shelters
         WHERE id = $1`,
        [shelter_id]
      );

      if (shelterCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Shelter not found.",
        });
      }

      const shelter = shelterCheck.rows[0];

      if (shelter.status === "Closed") {
        return res.status(400).json({
          message:
            "This shelter is currently closed.",
        });
      }

      // Prevent duplicate booking

      const existingBooking = await pool.query(
        `SELECT id
         FROM bookings
         WHERE user_id = $1
         AND shelter_id = $2
         AND status IN ('Pending', 'Accepted')`,
        [user_id, shelter_id]
      );

      console.log(
        "BOOKING CHECK:",
        {
          user_id,
          shelter_id,
          existing: existingBooking.rows,
        }
      );

      if (existingBooking.rows.length > 0) {
        return res.status(409).json({
          message:
            "You already have a pending or accepted booking for this shelter.",
        });
      }

      // Create booking

      const result = await pool.query(
        `INSERT INTO bookings
         (user_id, shelter_id, status)
         VALUES ($1, $2, 'Pending')
         RETURNING *`,
        [user_id, shelter_id]
      );

      res.status(201).json({
        message:
          "Shelter booking submitted successfully!",
        booking: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Create booking error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to create shelter booking.",
        error: error.message,
      });
    }
  }
);


// ===============================
// GET USER BOOKINGS
// ===============================

app.get(
  "/api/bookings/user/:userId",
  async (req, res) => {
    try {
      const { userId } = req.params;

      const result = await pool.query(
        `SELECT
            b.id,
            b.status,
            b.created_at,
            s.id AS shelter_id,
            s.name AS shelter_name,
            s.location,
            s.capacity,
            s.available_capacity,
            s.status AS shelter_status
         FROM bookings b
         JOIN shelters s
         ON b.shelter_id = s.id
         WHERE b.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      );

      res.json({
        bookings: result.rows,
      });

    } catch (error) {
      console.error(
        "Get user bookings error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch user bookings.",
        error: error.message,
      });
    }
  }
);


// ===============================
// ADMIN: GET ALL BOOKINGS
// ===============================

app.get(
  "/api/bookings",
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
            b.id,
            b.status,
            b.created_at,
            u.id AS user_id,
            u.name AS user_name,
            u.email AS user_email,
            s.id AS shelter_id,
            s.name AS shelter_name,
            s.location,
            s.capacity,
            s.available_capacity,
            s.status AS shelter_status
         FROM bookings b
         JOIN users u
         ON b.user_id = u.id
         JOIN shelters s
         ON b.shelter_id = s.id
         ORDER BY b.created_at DESC`
      );

      res.json({
        bookings: result.rows,
      });

    } catch (error) {
      console.error(
        "Get all bookings error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to fetch bookings.",
        error: error.message,
      });
    }
  }
);


// ===============================
// ADMIN: ACCEPT / REJECT BOOKING
// ===============================

app.put(
  "/api/bookings/:id/status",
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          message: "Status is required.",
        });
      }

      const allowedStatuses = [
        "Pending",
        "Accepted",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid booking status.",
        });
      }

      // Check booking

      const bookingCheck = await pool.query(
        `SELECT *
         FROM bookings
         WHERE id = $1`,
        [id]
      );

      if (bookingCheck.rows.length === 0) {
        return res.status(404).json({
          message: "Booking not found.",
        });
      }

      // Accept booking

      if (status === "Accepted") {

        console.log(
          "ACCEPT BOOKING - Shelter ID:",
          bookingCheck.rows[0].shelter_id
        );

        console.log(
          "Updating available capacity..."
        );

        const capacityCheck =
          await pool.query(
            `SELECT available_capacity
             FROM shelters
             WHERE id = $1`,
            [bookingCheck.rows[0].shelter_id]
          );

        const available = Number(
          capacityCheck.rows[0]
            ?.available_capacity || 0
        );

        if (available <= 0) {
          return res.status(400).json({
            message:
              "Shelter is currently full.",
          });
        }

        await pool.query(
          `UPDATE shelters
           SET available_capacity =
             available_capacity - 1
           WHERE id = $1`,
          [bookingCheck.rows[0].shelter_id]
        );
        
      }

      // Update booking status

      const result = await pool.query(
        `UPDATE bookings
         SET status = $1
         WHERE id = $2
         RETURNING *`,
        [status, id]
      );

      res.json({
        message:
          `Booking ${status.toLowerCase()} successfully!`,
        booking: result.rows[0],
      });

    } catch (error) {
      console.error(
        "Update booking status error:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update booking status.",
        error: error.message,
      });
    }
  }
);


// ===============================
// SERVER START
// ===============================

console.log("WEATHER ROUTE LOADED");
console.log("TEST SERVER FILE LOADED");
console.log(
  "Weather URL: http://localhost:5000/api/weather-risk"
);
// ===============================
// CLOUD COMPLIANCE - AUDIT LOGS
// ===============================

app.get("/api/audit-logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      logs: result.rows
    });

  } catch (error) {
    console.error("Audit logs error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch audit logs"
    });
  }
});
app.listen(PORT, () => {
  console.log(
    `FloodFlow backend running on http://localhost:${PORT}`
  );
});