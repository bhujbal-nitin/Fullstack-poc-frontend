import React from "react";
import "./Dropdown.css";

export default function Dropdown({
  label,
  options = [],
  value,
  onChange,
  error,
  loading = false,
  fetchError = null,
  required = true,
}) {
  return (
    <div className="dropdown-container">
     <label className="dropdown-label" style={{ display: "inline-flex", alignItems: "center" }}>
  {label} {required && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`dropdown-select ${error ? "error" : ""}`}
        disabled={loading || fetchError} // disable if loading or fetch error
      >
        <option value="">
          {loading
            ? "Loading..."
            : fetchError
            ? "⚠️ Error loading data"
            : "-- Select --"}
        </option>

        {!loading &&
          !fetchError &&
          options.map((item, idx) => (
            <option key={idx} value={item}>
              {item}
            </option>
          ))}
      </select>

      {error && <p className="error-message">{error}</p>}
      {fetchError && <p className="error-message">⚠️ {fetchError}</p>}
    </div>
  );
}
