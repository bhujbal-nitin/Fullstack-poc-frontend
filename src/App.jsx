import React, { useState, useEffect } from "react";
import Pageheading from "./components/Pageheading";
import Dropdown from "./components/DropDown";
import TextInput from "./components/TextInput";
import UsecaseDetails from "./components/UsecaseDetails";
import Button from "./components/Button";
// import { regions, endCustomerTypes, processTypes } from "./data";
import "./App.css";

function App() {
  // Dropdown states
  const [salesPerson, setSalesPerson] = useState("");
  const [salesPersons, setSalesPersons] = useState([]);

  const [region, setRegion] = useState("");
  const [regions, setRegions] = useState([]);

  const [endCustomerType, setEndCustomerType] = useState("");
  const [endCustomerTypes, setEndCustomerTypes] = useState([]);

  const [processType, setProcessType] = useState("");
  const [processTypes, setProcessTypes] = useState([]);

  // Partner Info states
  const [partnerCompanyName, setPartnerCompanyName] = useState("");
  const [partnerSpoc, setPartnerSpoc] = useState("");
  const [partnerSpocEmail, setPartnerSpocEmail] = useState("");
  const [partnerDesignation, setPartnerDesignation] = useState("");
  const [partnerMobileNumber, setPartnerMobileNumber] = useState("");

  // Customer Info states
  const [companyName, setCompanyName] = useState("");
  const [spoc, setSpoc] = useState("");
  const [spocEmail, setSpocEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Usecase Details states
  const [usecase, setUsecase] = useState("");
  const [brief, setBrief] = useState("");

  const [submittedData, setSubmittedData] = useState(null);

  const [loading, setLoading] = useState(false);


  // Error states
  const [errors, setErrors] = useState({});

  // 🔹 Fetch sales persons from backend on mount
  useEffect(() => {
    fetch("http://localhost:5050/poc/getAllSalesPerson")
      .then(res => res.json())
      .then(setSalesPersons)
      .catch(err => console.error("Error fetching sales:", err));

    fetch("http://localhost:5050/poc/getAllRegion")
      .then(res => res.json())
      .then(setRegions)
      .catch(err => console.error("Error fetching regions:", err));

    fetch("http://localhost:5050/poc/getAllCustomerTypes")
      .then(res => res.json())
      .then(setEndCustomerTypes)
      .catch(err => console.error("Error fetching end customer types:", err));

    fetch("http://localhost:5050/poc/getAllProcessType")
      .then(res => res.json())
      .then(setProcessTypes)
      .catch(err => console.error("Error fetching process types:", err));
  }, []);

  // Live update & remove error
  const handleChange = (field, value) => {
    switch (field) {
      case "salesPerson": setSalesPerson(value); break;
      case "region": setRegion(value); break;
      case "endCustomerType": setEndCustomerType(value); break;
      case "processType": setProcessType(value); break;
      case "companyName": setCompanyName(value); break;
      case "spoc": setSpoc(value); break;
      case "spocEmail": setSpocEmail(value); break;
      case "designation": setDesignation(value); break;
      case "mobileNumber": setMobileNumber(value); break;
      case "usecase": setUsecase(value); break;
      case "brief": setBrief(value); break;

      // ✅ New Partner Info fields
      case "partnerCompanyName": setPartnerCompanyName(value); break;
      case "partnerSpoc": setPartnerSpoc(value); break;
      case "partnerSpocEmail": setPartnerSpocEmail(value); break;
      case "partnerDesignation": setPartnerDesignation(value); break;
      case "partnerMobileNumber": setPartnerMobileNumber(value); break;

      default: break;
    }

    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (field === "mobileNumber" || field === "partnerMobileNumber") {
        if (/^[0-9]{10}$/.test(value)) delete newErrors[field];
      } else if (value) {
        delete newErrors[field];
      }
      return newErrors;
    });
  };

  // Form submit
  const handleSubmit = () => {
    let newErrors = {};

    if (!salesPerson) newErrors.salesPerson = "Required";
    if (!region) newErrors.region = "Required";
    if (!endCustomerType) newErrors.endCustomerType = "Required";
    if (!processType) newErrors.processType = "Required";
    if (!companyName) newErrors.companyName = "Required";
    if (!spoc) newErrors.spoc = "Required";
    if (!spocEmail) newErrors.spocEmail = "Required";
    if (!designation) newErrors.designation = "Required";
    if (mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
      newErrors.mobileNumber = "Must be 10 digits";
    }
    if (!usecase) newErrors.usecase = "Required";
    if (!brief) newErrors.brief = "Required";

    // ✅ Partner validation only if selected
    if (endCustomerType === "Partner") {
      if (!partnerCompanyName) newErrors.partnerCompanyName = "Required";
      if (!partnerSpoc) newErrors.partnerSpoc = "Required";
      if (!partnerSpocEmail) newErrors.partnerSpocEmail = "Required";
      if (!partnerDesignation) newErrors.partnerDesignation = "Required";
      if (partnerMobileNumber && !/^[0-9]{10}$/.test(partnerMobileNumber)) {
        newErrors.partnerMobileNumber = "Must be 10 digits";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      salesPerson,
      region,
      endCustomerType,
      processType,
      companyName,
      spoc,
      spocEmail,
      designation,
      mobileNumber,
      usecase,
      brief,
      partnerCompanyName,
      partnerSpoc,
      partnerSpocEmail,
      partnerDesignation,
      partnerMobileNumber,
    };

    setLoading(true); // 🔹 disable button while saving

    fetch("http://localhost:5050/poc/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || "Unknown error");
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.id) {
          // ✅ Show confirmation in table instead of alert
          setSubmittedData(data);

          // reset form
          setSalesPerson("");
          setRegion("");
          setEndCustomerType("");
          setProcessType("");
          setCompanyName("");
          setSpoc("");
          setSpocEmail("");
          setDesignation("");
          setMobileNumber("");
          setUsecase("");
          setBrief("");
          setPartnerCompanyName("");
          setPartnerSpoc("");
          setPartnerSpocEmail("");
          setPartnerDesignation("");
          setPartnerMobileNumber("");
          setErrors({});
        } else {
          alert("⚠️ POC creation failed (no ID returned).");
        }
      })
      .catch((err) => {
        console.error("Error saving POC:", err);
        alert("❌ POC creation failed: " + err.message);
      })
      .finally(() => {
        setLoading(false); // 🔹 re-enable button after request
      });
  };


  // 🔹 Confirmation screen
  if (submittedData) {
  return (
    <div className="confirmation-container">
      <h2 className="confirmation-title">✅ POC Created Successfully</h2>
      <table className="poc-table">
        <tbody>
          <tr><th>ID</th><td>{submittedData.id}</td></tr>
          <tr><th>Sales Person</th><td>{submittedData.salesPerson}</td></tr>
          <tr><th>Region</th><td>{submittedData.region}</td></tr>
          <tr><th>End Customer Type</th><td>{submittedData.endCustomerType}</td></tr>
          <tr><th>Process Type</th><td>{submittedData.processType}</td></tr>
          <tr><th>Customer Company</th><td>{submittedData.companyName}</td></tr>
          <tr><th>Customer SPOC</th><td>{submittedData.spoc}</td></tr>
          <tr><th>Customer SPOC Email</th><td>{submittedData.spocEmail}</td></tr>
          <tr><th>Designation</th><td>{submittedData.designation}</td></tr>
          <tr><th>Mobile</th><td>{submittedData.mobileNumber}</td></tr>
          <tr><th>Use Case</th><td>{submittedData.usecase}</td></tr>
          <tr><th>Brief</th><td>{submittedData.brief}</td></tr>

          {/* Partner Info only if Partner */}
          {submittedData.endCustomerType === "Partner" && (
            <>
              <tr><th>Partner Company</th><td>{submittedData.partnerCompanyName}</td></tr>
              <tr><th>Partner SPOC</th><td>{submittedData.partnerSpoc}</td></tr>
              <tr><th>Partner SPOC Email</th><td>{submittedData.partnerSpocEmail}</td></tr>
              <tr><th>Partner Designation</th><td>{submittedData.partnerDesignation}</td></tr>
              <tr><th>Partner Mobile</th><td>{submittedData.partnerMobileNumber}</td></tr>
            </>
          )}
        </tbody>
      </table>

        {/* ✅ Only keep New POC button */}
        <Button onClick={() => setSubmittedData(null)} label="New POC" />
      </div>
    );



  };

  return (
    <div>
      <Pageheading />

      {/* AE Sales Info Section */}
      <div className="section-container">
        <h2 className="section-title">AE Sales Info</h2>
        <div className="dropdown-row">
          <Dropdown
            label="Sales Person Name"
            options={salesPersons}
            value={salesPerson}
            onChange={(val) => handleChange("salesPerson", val)}
            error={errors.salesPerson}
          />
          <Dropdown
            label="Region"
            options={regions}
            value={region}
            onChange={(val) => handleChange("region", val)}
            error={errors.region}
          />
          <Dropdown
            label="End Customer Type"
            options={endCustomerTypes}
            value={endCustomerType}
            onChange={(val) => handleChange("endCustomerType", val)}
            error={errors.endCustomerType}
          />
          <Dropdown
            label="Process Type"
            options={processTypes}
            value={processType}
            onChange={(val) => handleChange("processType", val)}
            error={errors.processType}
          />
        </div>
      </div>

      {/* Partner Info Section */}
      {endCustomerType === "Partner" && (
        <div className="section-container">
          <h2 className="section-title">Partner Info</h2>
          <div className="input-row">
            <TextInput
              label="Partner Company Name"
              value={partnerCompanyName}
              onChange={(val) => handleChange("partnerCompanyName", val)}
              error={errors.partnerCompanyName}
              required={true}
            />
            <TextInput
              label="Partner SPOC"
              value={partnerSpoc}
              onChange={(val) => handleChange("partnerSpoc", val)}
              error={errors.partnerSpoc}
              required={true}
            />
            <TextInput
              label="Partner SPOC Email"
              value={partnerSpocEmail}
              onChange={(val) => handleChange("partnerSpocEmail", val)}
              error={errors.partnerSpocEmail}
              required={true}
            />
            <TextInput
              label="Partner Designation"
              value={partnerDesignation}
              onChange={(val) => handleChange("partnerDesignation", val)}
              error={errors.partnerDesignation}
              required={true}
            />
            <TextInput
              label="Partner Mobile Number"
              value={partnerMobileNumber}
              onChange={(val) => handleChange("partnerMobileNumber", val)}
              error={errors.partnerMobileNumber}
              required={false}
            />
          </div>
        </div>
      )}

      {/* Customer Info Section */}
      <div className="section-container">
        <h2 className="section-title">Customer Info</h2>
        <div className="input-row">
          <TextInput
            label="Company Name"
            value={companyName}
            onChange={(val) => handleChange("companyName", val)}
            error={errors.companyName}
            required={true}
          />
          <TextInput
            label="SPOC"
            value={spoc}
            onChange={(val) => handleChange("spoc", val)}
            error={errors.spoc}
            required={true}
          />
          <TextInput
            label="SPOC Email"
            value={spocEmail}
            onChange={(val) => handleChange("spocEmail", val)}
            error={errors.spocEmail}
            required={true}
          />
          <TextInput
            label="Designation"
            value={designation}
            onChange={(val) => handleChange("designation", val)}
            error={errors.designation}
            required={true}
          />
          <TextInput
            label="Mobile Number"
            value={mobileNumber}   // ✅ should use mobileNumber state
            onChange={(val) => handleChange("mobileNumber", val)}
            error={errors.mobileNumber}
            required={false}
          />

        </div>
      </div>

      {/* Usecase Details Section */}
      <UsecaseDetails
        usecase={usecase}
        setUsecase={(val) => handleChange("usecase", val)}
        brief={brief}
        setBrief={(val) => handleChange("brief", val)}
        errors={errors}
        required={true}   // pass this inside if your UsecaseDetails supports it
      />


      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        label={loading ? "Please wait..." : "Initiate POC"}
        type="submit"
        disabled={loading}
      />

    </div>
  );
}

export default App;
