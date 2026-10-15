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
  placeholder,
  showLabel = true,
  icon = null,
  size,
  fullWidth = false,
  disabled = false,
}) {
  const isSmall = size === "small";

  const selectStyle = {
    ...(isSmall && { padding: "6px 8px", fontSize: "0.85rem" }),
    ...(fullWidth && { width: "100%", boxSizing: "border-box" }),
  };

  return (
    <div
      className="dropdown-container"
      style={fullWidth ? { width: "100%", maxWidth: "none" } : undefined}
    >
      {showLabel && (
        <label className="dropdown-label" style={{ display: "inline-flex", alignItems: "center" }}>
          {icon && <span style={{ display: "inline-flex", marginRight: 6 }}>{icon}</span>}
          {label} {required && <span style={{ color: "red", marginLeft: "4px" }}>*</span>}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`dropdown-select ${error ? "error" : ""}`}
        disabled={loading || !!fetchError || disabled}
        style={selectStyle}
      >
        <option value="">
          {loading
            ? "Loading..."
            : fetchError
            ? "⚠️ Error loading data"
            : placeholder || "-- Select --"}
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
