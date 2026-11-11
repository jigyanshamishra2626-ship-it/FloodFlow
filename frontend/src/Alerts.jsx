import { Link } from "react-router-dom";

function Alerts() {
  const alerts = [
    {
      location: "Bhubaneswar",
      level: "High",
      message: "Heavy rainfall may cause waterlogging in low-lying areas.",
      time: "10 minutes ago",
    },
    {
      location: "Cuttack",
      level: "Medium",
      message: "Water level is rising near nearby rivers. Stay alert.",
      time: "25 minutes ago",
    },
    {
      location: "Puri",
      level: "Low",
      message: "Weather conditions are being monitored.",
      time: "1 hour ago",
    },
  ];

  const riskColors = {
    High: "#e53935",
    Medium: "#f59e0b",
    Low: "#16a34a",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f8fb",
      paddingBottom: "45px",
      fontFamily: "Segoe UI, Arial, sans-serif",
    }}>

      {/* NAVBAR */}
      <nav style={{
        background: "linear-gradient(100deg, #0b4f6c, #087eaa)",
        padding: "18px 5%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        boxShadow: "0 5px 18px rgba(0,0,0,0.18)",
      }}>
        <h2 style={{
          color: "#ffffff",
          margin: 0,
          fontSize: "27px",
          fontWeight: 850,
          textShadow: "1px 2px 5px rgba(0,0,0,0.25)",
        }}>
          🌊 FloodFlow
        </h2>

        <div style={{
          display: "flex",
          gap: "25px",
          flexWrap: "wrap",
        }}>
          {[
            ["/", "Home"],
            ["/alerts", "Alerts"],
            ["/shelters", "Shelters"],
          ].map(([path, label]) => (
            <Link key={path} to={path} style={{
              color: "#ffffff",
              textDecoration: "none",
              fontSize: "16px",
              fontWeight: 700,
            }}>
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* PAGE HEADING */}
      <div style={{
        textAlign: "center",
        padding: "50px 20px 30px",
      }}>
        <h1 style={{
          color: "#0b4f6c",
          fontSize: "40px",
          fontWeight: 900,
          marginBottom: "12px",
          textShadow: "2px 3px 6px rgba(11,79,108,0.18)",
        }}>
          🚨 Flood Alerts
        </h1>

        <p style={{
          color: "#34536d",
          fontSize: "18px",
          fontWeight: 600,
          lineHeight: 1.7,
        }}>
          Stay informed about flood risks and emergency conditions.
        </p>
      </div>

      {/* ALERT LIST */}
      <div style={{
        width: "90%",
        maxWidth: "1350px",
        margin: "auto",
      }}>
        <h2 style={{
          color: "#0b4f6c",
          fontSize: "28px",
          fontWeight: 850,
          marginBottom: "24px",
          textShadow: "1px 2px 4px rgba(11,79,108,0.12)",
        }}>
          Current Alerts ({alerts.length})
        </h2>

        {alerts.map((alert, index) => (
          <div key={index} style={{
            background: "#ffffff",
            padding: "28px",
            marginBottom: "23px",
            borderRadius: "17px",
            border: "1px solid #d5eaf4",
            borderLeft: `7px solid ${riskColors[alert.level]}`,
            boxShadow: "0 7px 22px rgba(11,79,108,0.12)",
            transition: "all 0.3s ease",
          }}>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "15px",
            }}>
              <h2 style={{
                margin: 0,
                color: "#0b4f6c",
                fontSize: "25px",
                fontWeight: 850,
                textShadow: "1px 2px 4px rgba(11,79,108,0.12)",
              }}>
                📍 {alert.location}
              </h2>

              <span style={{
                padding: "9px 18px",
                borderRadius: "30px",
                color: "#ffffff",
                background: riskColors[alert.level],
                fontSize: "15px",
                fontWeight: 800,
                boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              }}>
                {alert.level} Risk
              </span>
            </div>

            <p style={{
              fontSize: "18px",
              color: "#263f59",
              fontWeight: 600,
              lineHeight: 1.8,
              margin: "20px 0 15px",
            }}>
              {alert.message}
            </p>

            <div style={{
              color: "#526b80",
              fontSize: "15px",
              fontWeight: 700,
              borderTop: "1px solid #dcebf5",
              paddingTop: "14px",
            }}>
              🕒 {alert.time}
            </div>
          </div>
        ))}
      </div>

      {/* EMERGENCY WARNING */}
      <div style={{
        width: "90%",
        maxWidth: "1350px",
        boxSizing: "border-box",
        margin: "35px auto",
        padding: "28px",
        background: "#fff3cd",
        border: "1px solid #f3d38a",
        borderLeft: "7px solid #e59a00",
        borderRadius: "16px",
        boxShadow: "0 7px 20px rgba(130,90,0,0.12)",
        textAlign: "center",
      }}>
        <h3 style={{
          color: "#874800",
          fontSize: "24px",
          fontWeight: 850,
          marginTop: 0,
        }}>
          ⚠️ Emergency Warning
        </h3>

        <p style={{
          color: "#634719",
          fontSize: "17px",
          fontWeight: 600,
          lineHeight: 1.8,
          marginBottom: 0,
        }}>
          If you are in a flood-prone area, move to a safe location
          and follow local emergency instructions.
        </p>
      </div>

    </div>
  );
}

export default Alerts;
