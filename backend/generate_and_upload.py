"""
Generate a sample medical report, convert to multiple image formats, and upload all to the API.
"""
import os, io, requests, base64
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from PIL import Image

os.chdir(os.path.dirname(os.path.abspath(__file__)))

BASE_URL = "http://localhost:8000"
UPLOAD_DIR = "test_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ── Auth: register + login ──
def register_and_login():
    try:
        r = requests.post(f"{BASE_URL}/auth/register", json={
            "username": "testobvis@example.com",
            "email": "testobvis@example.com",
            "password": "Test1234!"
        })
        print(f"[register] {r.status_code} {r.text}")
    except Exception as e:
        print(f"[register] already exists or error: {e}")

    r = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "testobvis@example.com",
        "email": "testobvis@example.com",
        "password": "Test1234!"
    })
    print(f"[login] {r.status_code}")
    data = r.json()
    token = data.get("access_token", "")
    if not token:
        print(f"[login] response: {data}")
        return None
    return token


# ── Generate PDF ──
def create_pdf():
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    elements = []

    # title
    title_style = ParagraphStyle('title2', parent=styles['Title'], fontSize=20, textColor=colors.HexColor('#1a5276'), alignment=1)
    elements.append(Paragraph("COMPREHENSIVE BLOOD TEST REPORT", title_style))
    elements.append(Spacer(1, 5))
    elements.append(Paragraph("Patient: John Doe &nbsp;&nbsp;|&nbsp;&nbsp; Age: 34 &nbsp;&nbsp;|&nbsp;&nbsp; Date: 2026-04-05", ParagraphStyle('sub', parent=styles['Normal'], alignment=1, fontSize=10)))
    elements.append(Paragraph("Lab: City Diagnostics, New Delhi &nbsp;&nbsp;|&nbsp;&nbsp; Ref. Dr. Sarah Mehta", ParagraphStyle('sub2', parent=styles['Normal'], alignment=1, fontSize=10)))
    elements.append(Spacer(1, 20))

    # CBC section
    elements.append(Paragraph("COMPLETE BLOOD COUNT (CBC)", styles['Heading2']))
    elements.append(Spacer(1, 8))

    cbc_data = [
        [Paragraph("<b>Test</b>"), Paragraph("<b>Result</b>"), Paragraph("<b>Unit</b>"), Paragraph("<b>Ref. Range</b>"), Paragraph("<b>Flag</b>")],
        ["Hemoglobin", "14.2", "g/dL", "13.0–17.0", "Normal"],
        ["WBC Count", "12.8", "x10^3/uL", "4.0–11.0", "HIGH"],
        ["RBC Count", "4.9", "x10^6/uL", "4.5–5.5", "Normal"],
        ["Platelet Count", "265", "x10^3/uL", "150–400", "Normal"],
        ["Hematocrit", "42.1", "%", "40.0–52.0", "Normal"],
        ["MCV", "86", "fL", "80–96", "Normal"],
        ["Neutrophils", "72", "%", "40–75", "Normal"],
        ["Lymphocytes", "22", "%", "20–45", "Normal"],
    ]

    cbc_table = Table(cbc_data, colWidths=[140, 80, 60, 80, 60])
    cbc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.7, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(cbc_table)
    elements.append(Spacer(1, 20))

    # Metabolic section
    elements.append(Paragraph("COMPREHENSIVE METABOLIC PANEL", styles['Heading2']))
    elements.append(Spacer(1, 8))

    cmp_data = [
        [Paragraph("<b>Test</b>"), Paragraph("<b>Result</b>"), Paragraph("<b>Unit</b>"), Paragraph("<b>Ref. Range</b>"), Paragraph("<b>Flag</b>")],
        ["Fasting Glucose", "110", "mg/dL", "70–99", "HIGH"],
        ["HbA1c", "6.1", "%", "4.0–5.6", "HIGH"],
        ["Blood Urea Nitrogen", "20", "mg/dL", "7–20", "Borderline"],
        ["Creatinine", "0.9", "mg/dL", "0.7–1.3", "Normal"],
        ["Total Protein", "7.1", "g/dL", "6.0–8.3", "Normal"],
        ["Albumin", "4.2", "g/dL", "3.5–5.5", "Normal"],
        ["Total Bilirubin", "0.6", "mg/dL", "0.1–1.2", "Normal"],
        ["ALT (SGPT)", "48", "U/L", "7–56", "Normal"],
        ["AST (SGOT)", "35", "U/L", "10–40", "Normal"],
        ["Alkaline Phosphatase", "85", "U/L", "44–147", "Normal"],
    ]

    cmp_table = Table(cmp_data, colWidths=[140, 80, 60, 80, 60])
    cmp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.7, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(cmp_table)
    elements.append(Spacer(1, 20))

    # Lipid panel
    elements.append(Paragraph("LIPID PANEL", styles['Heading2']))
    elements.append(Spacer(1, 8))

    lipid_data = [
        [Paragraph("<b>Test</b>"), Paragraph("<b>Result</b>"), Paragraph("<b>Unit</b>"), Paragraph("<b>Ref. Range</b>"), Paragraph("<b>Flag</b>")],
        ["Total Cholesterol", "240", "mg/dL", "< 200", "HIGH"],
        ["LDL Cholesterol", "160", "mg/dL", "< 100", "HIGH"],
        ["HDL Cholesterol", "42", "mg/dL", "> 40", "Normal"],
        ["Triglycerides", "190", "mg/dL", "< 150", "HIGH"],
        ["VLDL", "38", "mg/dL", "5–40", "Borderline"],
    ]

    lipid_table = Table(lipid_data, colWidths=[140, 80, 60, 80, 60])
    lipid_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1a5276')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('GRID', (0,0), (-1,-1), 0.7, colors.grey),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(lipid_table)
    elements.append(Spacer(1, 25))

    # Impression
    impression_style = ParagraphStyle('imp', parent=styles['Normal'], fontSize=11)
    elements.append(Paragraph("<b>CLINICAL IMPRESSION:</b>", styles['Heading2']))
    elements.append(Paragraph("• Leukocytosis (WBC 12.8) — suggestive of mild infection or inflammation.", impression_style))
    elements.append(Paragraph("• Fasting hyperglycemia with HbA1c 6.1% — pre-diabetic range.", impression_style))
    elements.append(Paragraph("• Elevated total cholesterol, LDL, and triglycerides — dyslipidemia.", impression_style))
    elements.append(Paragraph("• Borderline BUN — ensure adequate hydration.", impression_style))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("Dr. Sarah Mehta, MD", ParagraphStyle('sig', parent=styles['Normal'], fontSize=11)))
    elements.append(Paragraph("Pathologist, City Diagnostics", ParagraphStyle('sig2', parent=styles['Normal'], fontSize=9, textColor=colors.grey)))

    doc.build(elements)
    buf.seek(0)
    return buf.read()


def generate_images_from_pdf(raw_pdf: bytes):
    """Use reportlab to render PDF → render as image using PIL by creating an image-based report."""
    # We'll create images directly since PDF → Image requires poppler/magick
    # Create sample report image using PIL drawing
    from PIL import ImageDraw, ImageFont

    formats = {
        "png": "PNG",
        "jpg": "JPEG",
        "jpeg": "JPEG",
        "webp": "WEBP",
        "bmp": "BMP",
        "tiff": "TIFF",
    }

    img_files = {}
    for ext, fmt in formats.items():
        # Create a detailed report-like image
        w, h = 1200, 1600
        img = Image.new("RGB", (w, h), "#ffffff")
        draw = ImageDraw.Draw(img)

        # Header bar
        draw.rectangle([0, 0, w, 60], fill="#1a5276")
        # Title
        try:
            font_title = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 24)
            font_body = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 14)
            font_small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 11)
        except:
            font_title = ImageFont.load_default()
            font_body = ImageFont.load_default()
            font_small = ImageFont.load_default()

        draw.text((w//2 - 200, 15), "BLOOD TEST REPORT — IMAGE FORMAT", fill="white", font=font_title)

        # Patient info
        draw.text((30, 80), "Patient: John Doe    |    Age: 34    |    Date: 2026-04-05", fill="#333333", font=font_body)
        draw.text((30, 105), "Lab: City Diagnostics, New Delhi    |    Ref. Dr. Sarah Mehta", fill="#555555", font=font_small)

        # Table area
        y = 150
        draw.text((30, y), "COMPLETE BLOOD COUNT (CBC)", fill="#1a5276", font=font_title)
        y += 40

        # Table header
        draw.rectangle([30, y, 420, y+28], fill="#1a5276")
        draw.text((40, y+4), "Test", fill="white", font=font_body)
        draw.text((180, y+4), "Result", fill="white", font=font_body)
        draw.text((260, y+4), "Unit", fill="white", font=font_body)
        draw.text((310, y+4), "Ref. Range", fill="white", font=font_body)
        draw.text((390, y+4), "Flag", fill="white", font=font_body)
        y += 30

        rows = [
            ("Hemoglobin", "14.2", "g/dL", "13.0-17.0", "Normal"),
            ("WBC Count", "12.8", "x10^3/uL", "4.0-11.0", "HIGH"),
            ("RBC Count", "4.9", "x10^6/uL", "4.5-5.5", "Normal"),
            ("Platelet Count", "265", "x10^3/uL", "150-400", "Normal"),
            ("Hematocrit", "42.1", "%", "40.0-52.0", "Normal"),
            ("Neutrophils", "72", "%", "40-75", "Normal"),
            ("Fasting Glucose", "110", "mg/dL", "70-99", "HIGH"),
            ("HbA1c", "6.1", "%", "4.0-5.6", "HIGH"),
            ("Creatinine", "0.9", "mg/dL", "0.7-1.3", "Normal"),
            ("Total Protein", "7.1", "g/dL", "6.0-8.3", "Normal"),
            ("Total Cholesterol", "240", "mg/dL", "< 200", "HIGH"),
            ("LDL Cholesterol", "160", "mg/dL", "< 100", "HIGH"),
            ("HDL Cholesterol", "42", "mg/dL", "> 40", "Normal"),
            ("Triglycerides", "190", "mg/dL", "< 150", "HIGH"),
        ]

        bg = False
        for name, val, unit, rng, flag in rows:
            if bg:
                draw.rectangle([30, y, 500, y+26], fill="#f0f4f8")
            draw.text((40, y+3), name, fill="#222222", font=font_body)
            draw.text((180, y+3), val, fill="#222222", font=font_body)
            draw.text((260, y+3), unit, fill="#222222", font=font_body)
            draw.text((310, y+3), rng, fill="#222222", font=font_body)
            if flag == "HIGH":
                draw.text((390, y+3), flag, fill="#e74c3c", font=font_body)
            elif flag == "Borderline":
                draw.text((390, y+3), flag, fill="#f39c12", font=font_body)
            else:
                draw.text((390, y+3), flag, fill="#27ae60", font=font_body)
            draw.line([(30, y), (500, y)], fill="#cccccc", width=1)
            y += 27
            bg = not bg

        # Impression
        y += 20
        draw.text((30, y), "CLINICAL IMPRESSION:", fill="#1a5276", font=font_title)
        y += 35
        impressions = [
            "• Leukocytosis (WBC 12.8) — mild infection/inflammation",
            "• Fasting hyperglycemia, HbA1c 6.1% — pre-diabetic range",
            "• Elevated cholesterol, LDL, triglycerides — dyslipidemia",
            "• Borderline BUN — ensure hydration",
        ]
        for imp in impressions:
            draw.text((40, y), imp, fill="#444444", font=font_body)
            y += 24

        y += 20
        draw.text((30, y), "Dr. Sarah Mehta, MD — Pathologist", fill="#333333", font=font_body)
        y += 22
        draw.text((30, y), "City Diagnostics, New Delhi", fill="#888888", font=font_small)

        path = os.path.join(UPLOAD_DIR, f"blood_report.{ext}")
        save_kwargs = {}
        if fmt == "JPEG":
            img = img.convert("RGB")
        if fmt == "TIFF":
            save_kwargs["tiffinfo"] = None

        img.save(path, fmt, **save_kwargs)
        img_files[ext] = path
        print(f"  Generated: {path}")

    return img_files


def upload_file(token: str, filepath: str):
    filename = os.path.basename(filepath)
    ext = filename.rsplit(".", 1)[-1].lower()

    mime_map = {
        "pdf": "application/pdf",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp",
        "tiff": "image/tiff",
        "bmp": "image/bmp",
    }
    mime = mime_map.get(ext, "application/octet-stream")

    with open(filepath, "rb") as f:
        files = {"file": (filename, f, mime)}
        r = requests.post(
            f"{BASE_URL}/reports/upload",
            headers={"Authorization": f"Bearer {token}"},
            files=files,
        )
    return r.status_code, r.json()


def main():
    # 1. Check server
    try:
        r = requests.get(f"{BASE_URL}/health")
        if r.status_code != 200:
            print(f"[!] Server not healthy: {r.text}")
            return
        print("[OK] Server is running")
    except requests.ConnectionError:
        print("[!] Server not running! Start it with: cd backend && uvicorn app:app --reload")
        return

    # 2. Get token
    token = register_and_login()
    if not token:
        print("[!] Authentication failed")
        return
    print(f"[OK] Authenticated, token: {token[:20]}...")

    # 3. Generate PDF
    print("\n[1] Creating PDF medical report...")
    pdf_bytes = create_pdf()
    pdf_path = os.path.join(UPLOAD_DIR, "blood_report.pdf")
    with open(pdf_path, "wb") as f:
        f.write(pdf_bytes)
    print(f"  PDF saved: {pdf_path} ({len(pdf_bytes)} bytes)")

    # 4. Generate images
    print("\n[2] Generating report images in multiple formats...")
    img_files = generate_images_from_pdf(pdf_bytes)

    # 5. Upload all files
    print("\n[3] Uploading all files to API...\n")
    all_files = [pdf_path] + list(img_files.values())

    results = {}
    for filepath in all_files:
        filename = os.path.basename(filepath)
        print(f"  Uploading {filename}...")
        status, resp = upload_file(token, filepath)
        results[filename] = {"status": status, "response": resp}
        print(f"    -> {status} | analyzed: {resp.get('analyzed', False)} | status: {resp.get('status', 'N/A')}")

    # 6. Summary
    print("\n" + "=" * 60)
    print("UPLOAD SUMMARY")
    print("=" * 60)
    for name, info in results.items():
        analyzed = "✅" if info["response"].get("analyzed") else "❌"
        print(f"  {analyzed} {name:30s} (HTTP {info['status']}, status={info['response'].get('status', 'N/A')})")

    # 7. List all reports
    print("\n[4] Listing all reports for user...")
    r = requests.get(f"{BASE_URL}/reports", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        reports = r.json()
        for rpt in reports:
            print(f"  - {rpt['original_name']} | status: {rpt['status']} | analyzed: {rpt['analyzed']}")
    else:
        print(f"  Error: {r.status_code} {r.text}")


if __name__ == "__main__":
    main()
