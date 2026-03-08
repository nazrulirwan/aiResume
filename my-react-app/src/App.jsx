import "./App.css";
import JobDescripton from "./components/job-description.jsx";
import Result from "./components/result.jsx";
import ResumeUpload from "./components/resume-upload.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return(
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ResumeUpload/>} />
        <Route path="/job-description" element={<JobDescripton/>} />
        <Route path="/result" element={<Result/>} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App
