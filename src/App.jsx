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
function getTrafficLabel(traffic) {
  if (!traffic) return "Unknown traffic";

  const value = traffic.toLowerCase();

  if (value.includes("empty")) return "Looks empty";
  if (value.includes("low")) return "Low traffic";
  if (value.includes("medium")) return "Moderate traffic";
  if (value.includes("high")) return "Busy right now";

  return traffic;
}

function getModeLabel(mode) {
  if (!mode) return "default";

  const value = mode.toLowerCase();

  if (value.includes("emergency")) return "emergency";
  if (value.includes("privacy")) return "privacy";
  if (value.includes("clean")) return "cleanliness";
  if (value.includes("between")) return "between classes";
  if (value.includes("access")) return "accessibility";

  return value;
}

function getBestOptionReason(result, mode) {
  if (!result) return "Best overall option right now.";

  const modeLabel = getModeLabel(mode);
  const trafficLabel = getTrafficLabel(result.recentTraffic);
  const minutes = result.walkMinutes ?? result.walkTime ?? null;
  const minuteText = minutes ? `${minutes} min away` : "close by";

  if (modeLabel === "emergency") {
    if (
      (result.recentTraffic || "").toLowerCase().includes("empty") ||
      (result.recentTraffic || "").toLowerCase().includes("low")
    ) {
      return `Fastest low-friction choice — ${minuteText} and ${trafficLabel.toLowerCase()}.`;
    }
    return `Closest option for emergency use — ${minuteText}.`;
  }

  if (modeLabel === "privacy") {
    if (
      (result.recentTraffic || "").toLowerCase().includes("empty") ||
      (result.recentTraffic || "").toLowerCase().includes("low")
    ) {
      return `Best privacy pick — ${trafficLabel.toLowerCase()} and ${minuteText}.`;
    }
    return `Best privacy balance available right now — ${minuteText}.`;
  }

  if (modeLabel === "cleanliness") {
    return `Best cleanliness tradeoff right now — ${minuteText} with ${trafficLabel.toLowerCase()}.`;
  }

  if (modeLabel === "between classes") {
    return `Best quick stop between classes — ${minuteText}.`;
  }

  if (modeLabel === "accessibility") {
    return `Best accessibility-focused option available right now.`;
  }

  if (
    (result.recentTraffic || "").toLowerCase().includes("empty") ||
    (result.recentTraffic || "").toLowerCase().includes("low")
  ) {
    return `Best overall choice — ${minuteText} and ${trafficLabel.toLowerCase()}.`;
  }

  return `Best overall choice right now — ${minuteText}.`;
}

function getQuickWhyItems(result, mode) {
  if (!result) return [];

  const items = [];
  const modeLabel = getModeLabel(mode);
  const traffic = (result.recentTraffic || "").toLowerCase();
  const minutes = result.walkMinutes ?? result.walkTime ?? null;

  if (minutes) {
    items.push(`${minutes} min walk`);
  }

  if (traffic.includes("empty")) {
    items.push("Very low traffic");
  } else if (traffic.includes("low")) {
    items.push("Low traffic");
  } else if (traffic.includes("medium")) {
    items.push("Moderate traffic");
  } else if (traffic.includes("high")) {
    items.push("Busy");
  }

  if (modeLabel === "emergency") {
    items.push("Fastest decision");
  }

  if (modeLabel === "privacy") {
    items.push("Better privacy");
  }

  return items.slice(0, 3);
}
function getModeBannerText(mode) {
  if (!mode) return "";

  const m = mode.toLowerCase();

  if (m.includes("emergency")) {
    return "Go now — this is your fastest workable option.";
  }

  if (m.includes("privacy")) {
    return "Lowest-traffic nearby option.";
  }

  if (m.includes("clean")) {
    return "Cleanest nearby option based on current data.";
  }

  if (m.includes("between")) {
    return "Quickest stop before your next class.";
  }

  if (m.includes("access")) {
    return "Most accessible option nearby.";
  }

  return "Best option based on your selection.";
}
function getModeClass(mode) {
  if (!mode) return "default";

  const value = mode.toLowerCase();

  if (value.includes("emergency")) return "emergency";
  if (value.includes("privacy")) return "privacy";
  if (value.includes("clean")) return "clean";
  if (value.includes("access")) return "access";

  return "default";
}
function App() {
  const [mode, setMode] = useState("emergency");
  const [restrooms, setRestrooms] = useState(RESTROOMS);
  const topResultRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showAll, setShowAll] = useState(false);

  function usePurdueLocation() {
    setUserLocation({
      lat: 40.4278,
      lng: -86.9142,
      isTest: true
    });
  }

  const ranked = useMemo(() => {
    const items = [...restrooms];
    
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
  }, [restrooms, userLocation, mode]);
      const visibleResults = showAll ? ranked : ranked.slice(0, 3);
      const topResult = ranked[0];
      const bestOptionReason = getBestOptionReason(topResult, mode);
      const modeBannerText = getModeBannerText(mode);
      const modeClass = getModeClass(mode);

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
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isTest: false
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
  <h1>Purdue Relief (MVP)</h1>
  <p className="subtitle">
    Find the best restroom for your situation — fast and discreet.
  </p>
</header>

<div className="topActions">
  <button
    className="primary"
    onClick={() => {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          isTest: false
        });
      });
    }}
  >
    Use My Location
  </button>

  <div className="secondaryRow">
    <button className="ghost" onClick={usePurdueLocation}>
      Use Purdue Location
    </button>
  </div>
</div>

<div className="locationStatus">
  Routing from:{" "}
  {userLocation
    ? userLocation.isTest
      ? "Purdue Test Location"
      : "My Location"
    : "Not set"}
</div>

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

{modeBannerText && (
  <div className={`modeBanner ${modeClass}`}>
    {modeBannerText}
  </div>
)}

<div className="visibleResults">
  {visibleResults.map((r, idx) => {
  return (
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

  <div className="featuredMainRow">
    <div className="featuredLeft">
      <h2 className="featuredBuilding">{r.building}</h2>
      <div className="featuredSub">
        Floor {r.floor} • {r.direction}
      </div>
    </div>

    <div className="featuredWalk">
      {milesToMinutes(r.distanceMiles)}
      <span className="walkUnit">min</span>
    </div>
  </div>

  <div className="featuredLandmark">
    {r.landmark}
  </div>

  <div className="featuredWhy">
    {bestOptionReason}
  </div>

  <div className="featuredActions">
    <a
      href={r.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="startWalkingLink"
    >
      Start Walking →
    </a>
  </div>
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
    </div>
  );
})}
      </div>
    </div>
  );
}

export default App;