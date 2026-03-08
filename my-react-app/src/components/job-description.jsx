import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function JobDescription() {
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");

    //no job description pasted
    if (!jobDescription.trim()) {
      setError("Please paste a job description before submitting.");
      return;
    }

    // Retrieve the resume stored in the resume-upload page
    const stored = sessionStorage.getItem("resumeFile");
    //if no resumeFile in sessionStorage
    if (!stored) {
      setError("No resume found. Please go back and upload your resume first.");
      return;
    }

    //get name,type,data from resumeFile
    const { name, type, data } = JSON.parse(stored);

    // Reconstruct File from base64 data URL
    const base64 = data.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const resumeFile = new File([bytes], name, { type });

    // Build multipart form for the backend
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("job_description", jobDescription.trim());

    setLoading(true);//loading...
    //send resume and job description to server
    try {
      const response = await fetch("http://localhost:5001/score", {
        method: "POST",//flask method to send data to server
        body: formData,
      });

      //server error/server not ok
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Server error ${response.status}`);
      }

      const result = await response.json();
      // store result in browser so result.jsx can read it
      // result lose if tab is closed
      sessionStorage.setItem("scoreResult", JSON.stringify(result));//convert result from json to string
      navigate("/result");//navigate to result page
    } catch (err) {//if any error caught in try block
      setError(`Scoring failed: ${err.message}`);
    } finally {
      setLoading(false);//stops loading in all cases
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-xl">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Job Description</h1>
        <p className="text-slate-500 text-sm mb-6">
          Paste the full job listing to get your match score
        </p>

        <label htmlFor="jobDescription" className="block text-sm font-medium text-slate-700 mb-2">
          Job Description
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          rows={10}
          disabled={loading}
          className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-700 bg-slate-50 resize-y focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50"
        />
        <p className="text-xs text-slate-400 text-right mt-1 mb-4">
          {jobDescription.length.toLocaleString()} characters
        </p>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/")}
            disabled={loading}
            className="flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Analyzing…
              </>
            ) : (
              "Get Score →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobDescription;
