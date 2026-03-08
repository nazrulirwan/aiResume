import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeUpload() {
  const navigate = useNavigate();
  //constantly update the text boxt according to state
  const [message, setMessage] = useState({ text: "", colorClass: "" });

  //upload resume then pressing submit button; handle accordingly
  const handleSubmit = (e) => {
    e.preventDefault();//prevents the page from reloading from POST
    const fileInput = e.target.elements.resume;//get resume file from form

    //if no file is uploaded
    if (!fileInput.files.length) {
      setMessage({ text: "Please select a file first.", colorClass: "text-amber-600" });
      return;
    }

    const file = fileInput.files[0];
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    //if file not valid type
    if (!validTypes.includes(file.type)) {
      setMessage({ text: "Please upload a PDF or Word document.", colorClass: "text-red-600" });
      return;
    }

    // Read file as base64 so it can be passed across routes via sessionStorage
    const reader = new FileReader();
    reader.onload = () => {
      //store file in storage to be access in job-description page to get score
      //resume is not sent to server yet; it is stored until 'get score' button is pressed.
      sessionStorage.setItem(
        "resumeFile",//store under name resumeFile
        JSON.stringify({ name: file.name, type: file.type, data: reader.result })//convert to string to store in sessionstorage
      );
      navigate("/job-description");//navigate to job-description if file valid
    };
    reader.onerror = () => {
      setMessage({ text: "Failed to read file. Please try again.", colorClass: "text-red-600" });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Upload Resume</h1>
        <p className="text-slate-500 text-sm mb-6">Upload your resume in PDF or DOC format</p>

        <form id="uploadForm" className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="sr-only">Choose file</span>
            <input
              type="file"
              name="resume"
              accept=".pdf,.doc,.docx"
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </label>

          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Upload & Continue →
          </button>
        </form>

        {message.text && (
          <p className={`mt-4 text-sm ${message.colorClass}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;
