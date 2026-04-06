import httpx, base64, json, asyncio
from app.config import settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT_REPORT = (
    "CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no explanation, no code blocks.\n\n"
    "VALID JSON ONLY. DO NOT USE markdown formatting. DO NOT USE code blocks.\n"
    "MANDATORY_RESPONSE_FORMAT=true\n\n"
    "You are Obvis, a strict medical report analyzer. "
    "Read EVERY line of the medical report carefully. Extract ALL test values, even small ones. "
    "Analyze thoroughly — do NOT skip any test or section.\n\n"
    "Respond ONLY with valid JSON. NO markdown, NO code blocks, NO explanation text. "
    "The JSON MUST have EXACTLY these fields:\n\n"
    '{\n'
    '  "summary": "DETAILED 5-8 sentence summary. List EVERY major organ/system tested. Mention EACH abnormal finding specifically with its value. Explain what each abnormal value could indicate clinically. Group findings by body system. Include overall impression and clinical significance.",\n'
    '  "values": [\n'
    '    {"name": "test name", "value": "result value", "unit": "unit if present or empty", "normal_range": "reference range if present or empty", "flag": "NORMAL|HIGH|LOW|BORDERLINE"}\n'
    '  ],\n'
    '  "precautions": ["at least 5 specific precautions based on the report findings. If patient has abnormal values, mention precautions for those conditions. Be specific, not generic."],\n'
    '  "lifestyle_tips": ["at least 5 actionable lifestyle tips related to the abnormal findings and overall health. Mention diet, exercise, sleep, stress, hydration specifically. Be detailed and practical."],\n'
    '  "medicine_suggestions": ["ALWAYS suggest SPECIFIC medicine names (generic names) for abnormal findings. For example: Metformin for high glucose, Atorvastatin for high cholesterol, Amlodipine for high BP, etc. ALWAYS add: Consult a doctor before taking any medicine. Minimum 3 suggestions. BE SPECIFIC WITH DOSAGE RANGES WHEN APPROPRIATE."]\n'
    '}\n\n'
    "Rules:\n"
    "- Extract EVERY test from the report. Do not skip any.\n"
    "- Flag values as HIGH if above range, LOW if below range, BORDERLINE if near range, NORMAL if within range.\n"
    "- If report mentions any abnormality, precautions and medicine_suggestions MUST address it specifically.\n"
    "- medicine_suggestions MUST include specific generic medicine names, NOT just categories.\n"
    "- summary MUST be detailed (5-8 sentences), mention all findings with clinical context.\n"
    "- lifestyle_tips MUST be specific to the findings, not generic advice.\n"
    "- All arrays must have at least 3 items (medicine_suggestions ideally 5+).\n"
    "- If any test value is missing from extraction, return an error message in the summary instead of an incomplete response."
)

SYSTEM_PROMPT_SYMPTOM = (
    "You are Obvis, a medical symptom checker. "
    "Ask UP TO 5 short follow-up questions, one at a time. "
    "Track the question count yourself. "
    "When you have asked 5 questions OR the user gives enough info, provide a FULL medical analysis. "
    "Respond ONLY with valid JSON in this EXACT format:\n"
    "{"
    '"question":"next question to ask or empty string if done", '
    '"question_count":3, '
    '"analysis":"full analysis with summary, medicine suggestions, advice etc if 5 questions done, otherwise null", '
    '"summary":"brief summary of symptoms", '
    '"medicine_suggestions":["medicine suggestions if analysis ready, else empty"], '
    '"advice":["medical advice if analysis ready, else empty"], '
    '"recommendations":["lifestyle recommendations if analysis ready, else empty"]'
    "}\n"
    "Rules:\n"
    "- After 5 questions, analysis MUST be provided with specific medicine suggestions, advice, and recommendations.\n"
    "- medicine_suggestions should mention consult a doctor disclaimer.\n"
    "- Keep all text short and clear."
)


FALLBACK_MODELS = [
    "openrouter/free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemma-3-4b-it:free",
    "qwen/qwen3.6-plus:free",
]


async def _call_openrouter(messages, model=None, max_tokens=2000, retries=3):
    """Call OpenRouter with fast retry on 429 rate limits."""
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Obvis",
    }

    model_name = model or settings.openrouter_model
    payload = {
        "model": model_name,
        "messages": messages,
        "max_tokens": max_tokens,
    }

    for attempt in range(retries):
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)

            if resp.status_code == 429:
                wait = min((attempt + 1) * 2, 8)
                print(f"Rate limited on {model_name}. Waiting {wait}s (attempt {attempt+1}/{retries})...")
                await asyncio.sleep(wait)
                continue

            if resp.status_code != 200:
                print(f"Error from {model_name}: {resp.status_code} {resp.text}")
                break

            data = resp.json()
            return data["choices"][0]["message"]["content"]

    # Fallback to a free model if primary fails
    for fallback in ["google/gemma-3-4b-it:free", "openrouter/free"]:
        payload["model"] = fallback
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"]

    raise Exception("OpenRouter all models failed")


async def analyze_report_image(file_path: str, file_name: str):
    """Analyze a medical report image (JPG/PNG) via OpenRouter."""
    with open(file_path, "rb") as f:
        image_bytes = f.read()

    # Skip if file is too small (likely not a real image)
    if len(image_bytes) < 500:
        return {
            "summary": f"File too small to analyze — may not be a valid medical report.",
            "values": [],
            "precautions": ["Upload a clear medical report image for analysis"],
            "lifestyle_tips": [],
            "medicine_suggestions": ["Consult a doctor with your actual report"],
        }

    encoded = base64.b64encode(image_bytes).decode("utf-8")
    mime = "image/jpeg" if file_path.endswith((".jpg", ".jpeg")) else "image/png"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_REPORT},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": f"Analyze: {file_name}"},
                {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{encoded}"}},
            ],
        },
    ]

    raw = await _call_openrouter(messages, model=settings.openrouter_vision_model, max_tokens=3000)
    return _extract_json(raw)


async def analyze_report_pdf(content: bytes, file_name: str):
    """Read PDF text and analyze via OpenRouter."""
    import io
    text = ""
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        for page in reader.pages:
            text += page.extract_text() or ""
    except ImportError:
        text = f"PDF: {file_name} (text not extractable)"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_REPORT},
        {"role": "user", "content": f"Report: {file_name}\n\n{text}"},
    ]

    raw = await _call_openrouter(messages, max_tokens=3000)
    return _extract_json(raw)


async def symptom_chat_response(user_message: str, history: list = None):
    """Handle symptom chat. History is optional list of {role, content}."""
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_SYMPTOM},
    ]

    # add history if available
    if history:
        for msg in history[-10:]:  # keep last 10 msgs
            messages.append({"role": msg.get("role", "user"), "content": msg["text"]})

    messages.append({"role": "user", "content": user_message})

    try:
        raw = await _call_openrouter(messages, model="qwen/qwen3.6-plus:free", max_tokens=2000, retries=1)
        parsed = _extract_json(raw)
        return {
            "text": parsed.get("question", raw),
            "question_count": parsed.get("question_count", 0),
            "analysis": parsed.get("analysis"),
            "summary": parsed.get("summary"),
            "medicine_suggestions": parsed.get("medicine_suggestions", []),
            "advice": parsed.get("advice", []),
            "recommendations": parsed.get("recommendations", []),
        }
    except Exception as e:
        print(f"Symptom chat failed: {e}")
        # fallback response when rate limited
        return {
            "text": "I'm currently unable to process that due to high server traffic. Please save this symptom and consult with a doctor when possible. This is not a substitute for professional medical advice.",
            "fallback": True,
        }


def _extract_json(raw: str) -> dict:
    """Parse JSON from AI response with fallback."""
    # Remove markdown code blocks
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
    if raw.endswith("```"):
        raw = raw.rsplit("\n", 1)[0]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end > start:
        try:
            return json.loads(raw[start:end])
        except json.JSONDecodeError:
            pass

    return {
        "summary": f"Could not parse analysis: {raw[:500]}",
        "values": [],
        "precautions": ["Upload the report again for a detailed analysis"],
        "lifestyle_tips": [],
        "medicine_suggestions": ["Please consult a healthcare professional"],
        "question": "",
        "question_count": 0,
        "analysis": None,
        "advice": [],
        "recommendations": [],
    }