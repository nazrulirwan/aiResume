import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

function Result() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  // Animate the progress bar from 0 to actual score
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("scoreResult");//get result from sessionStorage
    if (!stored) {
      setError("No result found. Please complete the scoring flow first.");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setResult(parsed);
      // Animate counter up to real score
      let current = 0;
      const target = parsed.score;//parsed has score,summary,strengths,weakness; get score
      const step = Math.ceil(target / 60);
      const interval = setInterval(() => {
        current = Math.min(current + step, target);//animate progress circle from 0 to score
        setDisplayScore(current);
        if (current >= target) clearInterval(interval);
      }, 16);
      return () => clearInterval(interval);
    } catch {
      setError("Could not read result. Please try again.");
    }
  }, []);

  const handleStartOver = () => {
    sessionStorage.removeItem("resumeFile");
    sessionStorage.removeItem("scoreResult");
    navigate("/");
  };

  // Colour the bar based on score band
  const barColor =
    !result ? "#94a3b8" :
    result.score >= 75 ? "#10b981" :
    result.score >= 50 ? "#f59e0b" :
    "#ef4444";

  const scoreLabel =
    !result ? "" :
    result.score >= 75 ? "Strong Match" :
    result.score >= 50 ? "Partial Match" :
    "Low Match";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">

        {error ? (
          <>
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              onClick={handleStartOver}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Start Over
            </button>
          </>
        ) : result ? (
          <>
            {/* Title */}
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">Your Match Score</h1>
            <p className="text-slate-500 text-sm mb-8">Based on your resume vs. the job description</p>

            {/* Score circle + label */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-40 h-40 mb-4">
                <CircularProgressbar
                  value={displayScore}
                  text={`${displayScore}%`}
                  strokeWidth={8}
                  styles={buildStyles({
                    pathColor: barColor,
                    textColor: "#1e293b",
                    trailColor: "#e2e8f0",
                    textSize: "18px",
                  })}
                />
              </div>
              <span
                className="text-sm font-semibold px-3 py-1 rounded-full"
                style={{ background: `${barColor}1a`, color: barColor }}
              >
                {scoreLabel}
              </span>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-600 leading-relaxed">{result.summary}</p>
              </div>
            )}

            {/* Strengths */}
            {result.strengths?.length > 0 && (
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="text-emerald-500">✓</span> Strengths
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.strengths.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {result.gaps?.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                  <span className="text-amber-500">△</span> Areas to Improve
                </h2>
                <div className="flex flex-wrap gap-2">
                  {result.gaps.map((g, i) => (
                    <span
                      key={i}
                      className="text-xs font-medium px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStartOver}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              ↩ Score Another Resume
            </button>
          </>
        ) : (
          <p className="text-slate-400 text-sm">Loading result…</p>
        )}
      </div>
    </div>
  );
}

export default Result;
