import { useState } from "react";

function Assistance() {
  const [submitted, setSubmitted] = useState(false);
  const [sosMode, setSosMode] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="assistance-page">

      <div className="assistance-box">

        <h1>🚨 Emergency Assistance</h1>

        <p>Request emergency help</p>

        {!submitted ? (
          <>
            {/* SOS BUTTON */}
            {!sosMode && (
              <div className="sos-box">
                <h2>🆘 Need Immediate Help?</h2>

                <button
                  className="sos-button"
                  onClick={() => setSosMode(true)}
                >
                  🚨 SOS — Need Immediate Help
                </button>

                <p>
                  Use SOS for urgent flood emergency situations.
                </p>
              </div>
            )}

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                required
              />

              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                required
              />

              <label>Current Location</label>
              <input
                type="text"
                placeholder="Enter your current location"
                required
              />

              <label>Emergency Type</label>
              <select required>
                <option value="">
                  Select Emergency Type
                </option>
                <option>Medical Emergency</option>
                <option>Rescue Required</option>
                <option>Food Required</option>
                <option>Water Required</option>
                <option>Shelter Required</option>
                <option>Other</option>
              </select>

              <label>Message</label>

              <textarea
                placeholder="Describe your emergency"
                rows="4"
              />

              <button
                type="submit"
                className={sosMode ? "sos-submit" : "submit-button"}
              >
                {sosMode
                  ? "🚨 Send SOS Request"
                  : "🚨 Submit Request"}
              </button>

              {sosMode && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setSosMode(false)}
                >
                  Cancel SOS
                </button>
              )}

            </form>
          </>
        ) : (
          <div className="success-box">
            <h2>✅ Request Submitted</h2>

            <p>
              {sosMode
                ? "🚨 Your SOS emergency request has been received."
                : "Your emergency request has been received."}
            </p>

            <button
              className="submit-button"
              onClick={() => {
                setSubmitted(false);
                setSosMode(false);
              }}
            >
              Submit Another Request
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default Assistance;
