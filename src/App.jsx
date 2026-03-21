import { useMemo, useRef, useState } from "react";
import "./App.css";
import { RESTROOMS } from "./restrooms";

const MODES = [
  { key: "emergency", label: "Emergency" },
  { key: "privacy", label: "Privacy" },
  { key: "cleanest", label: "Cleanest" },
  { key: "access", label: "Accessibility" }
];


function trafficScore(t) {
  if (t === "Empty") return 0;
  if (t === "Moderate") return 1;
  if (t === "Busy") return 2;
  return 1;
}

function getStatus(room, mode, userLocation) {
  if (mode === "emergency") {
    if (room.recentTraffic === "Busy") return "red";
    if (room.recentTraffic === "Moderate") return "yellow";
    if (room.singleStall) return "yellow";
    return "green";
  }

  if (room.recentTraffic === "Busy") return "red";
  if (room.recentTraffic === "Moderate") return "yellow";
  return "green";
}

function repeatIcon(icon, count) {
  return Array.from({ length: count }, () => icon).join("");
}
function getConfidence(room, mode) {
  const lines = [];

  if (mode === "emergency") {
    if (room.singleStall && room.recentTraffic !== "Busy") {
      lines.push("Strong emergency option: fast + private.");
    } else if (room.recentTraffic === "Busy") {
      lines.push("May be crowded during urgent situations.");
    } else {
      lines.push("Quick access with manageable traffic.");
    }
  }

  if (mode === "privacy" && room.singleStall) {
    lines.push("Best privacy choice available.");
  }

  if (room.recentTraffic === "Empty") {
    lines.push("Recently reported low traffic.");
  }

  return lines.slice(0, 2);
}
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function milesToMinutes(miles) {
  const minutesPerMile = 17;
  return miles * minutesPerMile;
}
function usePurdueLocation() {
  setUserLocation({
    lat: 40.4278,
    lng: -86.9142
  });
}
function App() {
  const [mode, setMode] = useState("emergency");
  const [restrooms, setRestrooms] = useState(RESTROOMS);
  const topResultRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const ranked = useMemo(() => {
    const items = [...restrooms];

function usePurdueLocation() {
  setUserLocation({
    lat: 40.4278,
    lng: -86.9142
  });
}

    items.sort((a, b) => {
        if (mode === "emergency" && userLocation) {

    function emergencyScore(room) {
      const miles = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        room.lat,
        room.lng
      );

      const minutes = milesToMinutes(miles);

      let score = minutes;

      if (room.recentTraffic === "Busy") score += 3;
      if (room.recentTraffic === "Moderate") score += 1;


      return score;
    }

    return emergencyScore(a) - emergencyScore(b);
  }
      if (mode === "privacy") {
        const ss = Number(b.singleStall) - Number(a.singleStall);
        if (ss !== 0) return ss;
        return trafficScore(a.recentTraffic) - trafficScore(b.recentTraffic);
      }

      if (mode === "access") {
        const acc = Number(b.accessible) - Number(a.accessible);
        if (acc !== 0) return acc;
        return trafficScore(a.recentTraffic) - trafficScore(b.recentTraffic);
      }

      if (mode === "cleanest") {
        return trafficScore(a.recentTraffic) - trafficScore(b.recentTraffic);
      }

      if (userLocation) {
  const distA = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    a.lat,
    a.lng
  );

  const distB = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    b.lat,
    b.lng
  );

  return distA - distB;
}

return trafficScore(a.recentTraffic) - trafficScore(b.recentTraffic);
    });

    return items;
  }, [mode, restrooms, userLocation]);

  function reportTraffic(id, level) {
    setRestrooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, recentTraffic: level } : r))
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: "10px", textAlign: "center" }}>
  <button
  className="ghost"
  onClick={() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      () => alert("Location permission denied")
    );
  }}
>
  Use My Location
</button>

<button
  className="ghost"
  onClick={() =>
    setUserLocation({
      lat: 40.4278,
      lng: -86.9142
    })
  }
>
  Use Purdue Location
</button>
</div>
    
      <header className="header">
        {userLocation && (
          <div style={{ textAlign: "center", marginBottom: "10px", fontSize: "0.9rem" }}>
            Testing from: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        )}
        <h1>Purdue Relief (MVP)</h1>
        <p className="subtitle">
          Find the best restroom for your situation — fast and discreet.
        </p>
      </header>

      <div className="modes">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={mode === m.key ? "mode active" : "mode"}
            onClick={() => setMode(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <button className="ghost" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show Top 3" : "Show All"}
        </button>
      </div>
      <div className="results">
        {ranked.slice(0, showAll ? ranked.length : 3).map((r, idx) => (
          <div
            key={r.id}
            className={idx === 0 ? "card featuredCard" : "card"}
            ref={idx === 0 ? topResultRef : null}
          >
            {idx === 0 ? (
  <>
    <div className="featuredTop">
      <span className="bestOptionLabel">Best Option</span>

      <span className={`trafficPill ${r.recentTraffic.toLowerCase()}`}>
        {r.recentTraffic}
      </span>
    </div>

    <div className="featuredTitleRow">
      <div className="featuredTitleBlock">
        <h2>{r.building}</h2>
        <div className="floorText">Floor {r.floor}</div>
      </div>

      <div className="walkTimeBlock">
        <div className="walkTime">{milesToMinutes(r.distanceMiles)}</div>
        <div className="walkTimeLabel">min walk</div>
      </div>
    </div>

    <div className="featuredDirectionRow">
      <div className="directionText">{r.direction}</div>
    </div>

    <div className="featuredMetaRow">
      <div className="landmarkText">{r.landmark}</div>
    </div>

    <div className="featuredWhy">Best overall nearby option</div>
  </>
) : (
  <div className="cardTop">
    <div>
      <h3>
        {r.building} • Floor {r.floor}
      </h3>
      <div className="locationDetail">
        {r.direction} • {r.landmark}
      </div>
    </div>

    <span className={`pill ${r.recentTraffic.toLowerCase()}`}>
      {r.recentTraffic}
    </span>
  </div>
)}

  {userLocation && (
    <div className="distance">
      ~{milesToMinutes(
        calculateDistance(
          userLocation.lat,
          userLocation.lng,
          r.lat,
          r.lng
        )
      ).toFixed(1)} min walk
    </div>
  )}

            <div className="tags">
              {r.singleStall && <span className="tag">Single-stall</span>}
              {r.genderNeutral && <span className="tag">Gender-neutral</span>}
              {r.accessible && <span className="tag">Accessible</span>}
              {!r.singleStall && !r.genderNeutral && !r.accessible && (
                <span className="tag">Standard</span>
              )}
            </div>
           
            {(() => {
              const status = getStatus(r, mode, userLocation);

              return (
                <div className={`status ${status}`}>
                  {status === "green" && "🟢 Good to go"}
                  {status === "yellow" && "🟡 Moderate"}
                  {status === "red" && "🔴 Avoid"}
                </div>
              );
            })()}
            
            <div className="report">
              <div className="reportLabel">Report traffic:</div>
              <div className="reportButtons">
                <button
                  className={
                    r.recentTraffic === "Empty" ? "reportBtn active" : "reportBtn"
                  }
                  onClick={() => reportTraffic(r.id, "Empty")}
                >
                  Empty
                </button>
                <button
                  className={
                    r.recentTraffic === "Moderate"
                      ? "reportBtn active"
                      : "reportBtn"
                  }
                  onClick={() => reportTraffic(r.id, "Moderate")}
                >
                  Moderate
                </button>
                <button
                  className={
                    r.recentTraffic === "Busy" ? "reportBtn active" : "reportBtn"
                  }
                  onClick={() => reportTraffic(r.id, "Busy")}
                >
                  Busy
                </button>
              </div>
              <div className="hint">
                (MVP: local only — backend comes next)
              </div>
            </div>

            <div className="actions">
              <button className="ghost">Directions</button>
              <button className="ghost">Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;