import json
import os
import PyPDF2
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)

# Allow frontend (e.g. Vite on port 5173) to call this API
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    return response

@app.route("/score", methods=["OPTIONS"])
def score_options():
    return "", 204

#get and set api key
def _openai_client():
    api_key = os.getenv("OPENAI_API_KEY") #get from env since we load it alr
    if not api_key or not api_key.strip():
        raise ValueError("OPENAI_API_KEY is not set. Add it to your environment or .env.")
    return OpenAI(api_key=api_key.strip())


# ── Text extraction ────────────────────────────────────────────────────────────

def extract_text_from_pdf(pdf_path):
    """
    Extract text from a resume/job description file.
    Supports: PDF, DOCX.
    Note: .doc (legacy Word) is not supported without additional tooling.
    """
    text = ""
    _, ext = os.path.splitext(pdf_path)
    ext = (ext or "").lower()

    if ext == ".pdf":
        try:
            with open(pdf_path, "rb") as file:
                reader = PyPDF2.PdfReader(file)#PdfReader reads line by line
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            raise ValueError(f"Failed to read PDF: {e}") from e

    elif ext == ".docx":
        try:
            import mammoth#mammoth reads raw text as a whole
        except ImportError as e:
            raise ValueError(
                "DOCX parsing requires the 'mammoth' package. Install it with: pip install mammoth"
            ) from e
        try:
            with open(pdf_path, "rb") as file:
                result = mammoth.extract_raw_text(file)
                if result:
                    text = result.value
                else:
                    ""
        except Exception as e:
            raise ValueError(f"Failed to read DOCX: {e}") from e

    elif ext == ".doc":
        raise ValueError(
            "Legacy .doc files aren't supported. Please re-save your resume as PDF or DOCX."
        )

    else:
        raise ValueError(
            f"Unsupported file type '{ext or 'unknown'}'. Please upload a PDF or DOCX."
        )

    return text.strip()#strip whitespace


def extract_job_description_from_pdf(pdf_path):
    return extract_text_from_pdf(pdf_path)


# ── OpenAI scoring ─────────────────────────────────────────────────────────────

def score_resume(resume_text: str, job_description: str) -> dict:
    """
    Ask OpenAI to score a resume against a job description.
    Returns a dict with keys: score (int 0-100), summary (str), strengths, gaps.
    """
    client = _openai_client()
    prompt = f"""
You are an expert technical recruiter. Compare the resume below against the job description and return a JSON object with exactly these keys:
- "score": integer from 0 to 100 representing how well the resume matches the job
- "summary": one-sentence overall assessment
- "strengths": list of up to 5 matching strengths
- "gaps": list of up to 5 missing skills or qualifications

Return ONLY valid JSON, no markdown or extra text.

--- JOB DESCRIPTION ---
{job_description}

--- RESUME ---
{resume_text}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            response_format={"type": "json_object"},
            timeout=60.0,
        )
    except Exception as e:
        err_msg = str(e).strip() or type(e).__name__
        if "api_key" in err_msg.lower() or "authentication" in err_msg.lower():
            raise ValueError("Invalid or missing OpenAI API key. Check OPENAI_API_KEY.") from e
        if "rate" in err_msg.lower() or "limit" in err_msg.lower():
            raise ValueError("OpenAI rate limit hit. Please try again in a moment.") from e
        raise ValueError(f"OpenAI request failed: {err_msg}") from e

    raw = response.choices[0].message.content
    if not raw:
        raise ValueError("OpenAI returned an empty response.")
    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"OpenAI returned invalid JSON: {e}") from e
    return result


# ── Flask endpoints ────────────────────────────────────────────────────────────

@app.route("/score", methods=["POST"])
def score_endpoint():
    """
    Accepts multipart/form-data with:
      - resume:          PDF or DOCX file
      - job_description: PDF/DOCX file  OR  plain text field

    Returns JSON:
      {
        "score": 82,
        "summary": "Strong backend candidate with relevant Python experience.",
        "strengths": ["Python", "REST APIs", ...],
        "gaps": ["Kubernetes", ...]
      }
    """
    # ── 1. Get resume text ─────────────────────────────────────────────────────
    resume_file = request.files.get("resume")#request resume file 
    if not resume_file:
        return jsonify({"error": "No resume file provided."}), 400

    resume_path = f"/tmp/{resume_file.filename}"
    resume_file.save(resume_path)
    try:
        resume_text = extract_text_from_pdf(resume_path)
    except ValueError as e:
        return jsonify({"error": str(e)}), 422

    if not resume_text:
        return jsonify(
            {
                "error": (
                    "Could not extract text from resume. If this is a scanned/image-based PDF, "
                    "please upload a text-based PDF or DOCX."
                )
            }
        ), 422

    # ── 2. Get job description text ────────────────────────────────────────────
    jd_file = request.files.get("job_description")#request job-description file
    if jd_file:
        jd_path = f"/tmp/{jd_file.filename}"#get path jd
        jd_file.save(jd_path)#save path jd
        job_description = extract_job_description_from_pdf(jd_path)#extract jd text
    else:
        job_description = request.form.get("job_description", "").strip()

    if not job_description:
        return jsonify({"error": "No job description provided."}), 400

    # ── 3. Score via OpenAI ────────────────────────────────────────────────────
    try:
        result = score_resume(resume_text, job_description)
    except Exception as e:
        return jsonify({"error": f"OpenAI scoring failed: {str(e)}"}), 500

    return jsonify(result), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5001)#backend runs on port 5001