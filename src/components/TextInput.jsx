import React from "react";
import "./TextInput.css";

export default function TextInput({
  label,
  value,
  onChange,
  error,
  required,
  placeholder,
  showLabel = true,
  icon = null,
  multiline = false,
  rows = 3,
  type = "text",
  fullWidth = false,
  size,
  disabled = false,
  sx,
}) {
  const isSmall = size === "small";
  const computedPlaceholder = placeholder ?? (label ? `Enter ${label}` : "");

  const fieldStyle = {
    ...(isSmall && { padding: "6px 8px", fontSize: "0.85rem" }),
    ...(fullWidth && { width: "100%", boxSizing: "border-box" }),
  };

  const containerStyle = {
    ...(fullWidth && { width: "100%", maxWidth: "none" }),
    ...sx,
  };

  const commonProps = {
    value,
    onChange: (e) => onChange(e.target.value),
    placeholder: computedPlaceholder,
    className: `textinput-field ${error ? "error" : ""}`,
    disabled,
    style: fieldStyle,
  };

  return (
    <div className="textinput-container" style={containerStyle}>
      {showLabel && (
        <label className="textinput-label" style={{ display: "inline-flex", alignItems: "center" }}>
          {icon && <span style={{ display: "inline-flex", marginRight: 6 }}>{icon}</span>}
          {label}
          {required && <span style={{ color: "red" }}> *</span>}
        </label>
      )}

      {multiline ? (
        <textarea {...commonProps} rows={rows} />
      ) : (
        <input type={type} {...commonProps} />
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
