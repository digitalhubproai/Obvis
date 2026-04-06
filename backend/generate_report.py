"""
Generate a realistic medical report PDF with Obvis logo embedded.
Ready to upload to the Obvis API for AI analysis.
"""
import io, os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    HRFlowable, Image as PlatypusImage
)
from reportlab.lib.enums import TA_CENTER

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "sample_reports")
LOGO_PATH = os.path.join(OUTPUT_DIR, "obvis_logo.png")

os.makedirs(OUTPUT_DIR, exist_ok=True)


def create_report():
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        topMargin=25, bottomMargin=25,
        leftMargin=35, rightMargin=35
    )
    styles = getSampleStyleSheet()

    # ── Colors ──
    PRIMARY = colors.HexColor("#0d3b66")
    ACCENT = colors.HexColor("#0ea5e9")
    LIGHT_BG = colors.HexColor("#eef6fc")
    WHITE = colors.white
    RED_HIGH = colors.HexColor("#dc2626")

    # ── Custom styles ──
    section_style = ParagraphStyle('sec', parent=styles['Heading2'],
                                    fontSize=13, textColor=PRIMARY, spaceBefore=8, spaceAfter=4)
    normal_style = ParagraphStyle('ns', parent=styles['Normal'], fontSize=9, textColor=colors.black)
    imp_style = ParagraphStyle('imp', parent=styles['Normal'], fontSize=10, textColor='#333', leading=15)
    small_style = ParagraphStyle('sm', parent=styles['Normal'], fontSize=8, textColor=colors.gray)
    center_style = ParagraphStyle('ctr', alignment=TA_CENTER)

    elements = []

    # ──────────────── HEADER with LOGO ────────────────
    logo_img = PlatypusImage(LOGO_PATH, width=120, height=45)

    header_data = [
        [logo_img,
         Paragraph("<b>COMPREHENSIVE BLOOD TEST REPORT</b>",
                   ParagraphStyle('ht', parent=styles['Normal'],
                                  fontSize=16, textColor=PRIMARY)),
         Paragraph("Date: 05 Apr 2026<br/>Ref: OBV/2026/0472", small_style)]
    ]
    header_tbl = Table(header_data, colWidths=[130, 300, 100], rowHeights=[50])
    header_tbl.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
    elements.append(header_tbl)
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=5))

    # ─── Patient Info ───
    pt = ParagraphStyle('pt', parent=styles['Normal'], fontSize=10, textColor='#333')
    elements.append(Paragraph("<b>Patient:</b> John Doe  |  <b>Age/Sex:</b> 34 / Male  |  <b>Phone:</b> +91 98765 43210", pt))
    elements.append(Paragraph("<b>Referred By:</b> Dr. Sarah Mehta (MD)  |  <b>Lab:</b> City Diagnostics, New Delhi", pt))
    elements.append(Spacer(1, 10))

    # ─── Helper: table factory ───
    def make_table(title, data):
        elements.append(Paragraph(title, section_style))
        header_row = [
            Paragraph("<b><font color='white'>Test</font></b>"),
            Paragraph("<b><font color='white'>Result</font></b>"),
            Paragraph("<b><font color='white'>Unit</font></b>"),
            Paragraph("<b><font color='white'>Ref. Range</font></b>"),
            Paragraph("<b><font color='white'>Flag</font></b>"),
        ]
        rows = [header_row]
        for test, result, unit, ref, flag in data:
            if flag == "HIGH":
                rows.append([Paragraph(test), Paragraph(result), Paragraph(unit),
                             Paragraph(ref),
                             Paragraph("<font color='#dc2626'><b>HIGH</b></font>", style=center_style)])
            elif flag == "LOW":
                rows.append([Paragraph(test), Paragraph(result), Paragraph(unit),
                             Paragraph(ref),
                             Paragraph("<font color='#1565c0'><b>LOW</b></font>", style=center_style)])
            elif flag == "Borderline":
                rows.append([Paragraph(test), Paragraph(result), Paragraph(unit),
                             Paragraph(ref),
                             Paragraph("<font color='#d97706'><b>Borderline</b></font>", style=center_style)])
            else:
                rows.append([Paragraph(test), Paragraph(result), Paragraph(unit),
                             Paragraph(ref),
                             Paragraph("<font color='#16a34a'><b>Normal</b></font>", style=center_style)])

        t = Table(rows, colWidths=[140, 70, 55, 85, 60], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ddd')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 12))

    # ─── Section 1: CBC ───
    make_table("1. COMPLETE BLOOD COUNT (CBC)", [
        ("Hemoglobin", "14.2", "g/dL", "13.0 - 17.0", "Normal"),
        ("WBC Count", "12.8", "x10\u00b3/\u00b5L", "4.0 - 11.0", "HIGH"),
        ("RBC Count", "4.9", "x10\u2076/\u00b5L", "4.5 - 5.5", "Normal"),
        ("Platelet Count", "265,000", "/\u00b5L", "150,000 - 400,000", "Normal"),
        ("Hematocrit (PCV)", "42.1", "%", "40.0 - 52.0", "Normal"),
        ("MCV", "86", "fL", "80 - 96", "Normal"),
        ("MCH", "29.0", "pg", "27.0 - 33.0", "Normal"),
        ("Neutrophils", "72", "%", "40 - 75", "Normal"),
        ("Lymphocytes", "22", "%", "20 - 45", "Normal"),
        ("Eosinophils", "3.5", "%", "1.0 - 6.0", "Normal"),
    ])

    # ─── Section 2: CMP ───
    make_table("2. COMPREHENSIVE METABOLIC PANEL", [
        ("Fasting Blood Glucose", "110", "mg/dL", "70 - 99", "HIGH"),
        ("HbA1c", "6.1", "%", "4.0 - 5.6", "HIGH"),
        ("BUN", "20", "mg/dL", "7 - 20", "Borderline"),
        ("Serum Creatinine", "0.9", "mg/dL", "0.7 - 1.3", "Normal"),
        ("Total Protein", "7.1", "g/dL", "6.0 - 8.3", "Normal"),
        ("Serum Albumin", "4.2", "g/dL", "3.5 - 5.5", "Normal"),
        ("Total Bilirubin", "0.6", "mg/dL", "0.1 - 1.2", "Normal"),
        ("ALT (SGPT)", "48", "U/L", "7 - 56", "Normal"),
        ("AST (SGOT)", "35", "U/L", "10 - 40", "Normal"),
        ("ALP", "85", "U/L", "44 - 147", "Normal"),
        ("Sodium (Na\u207a)", "139", "mEq/L", "136 - 145", "Normal"),
        ("Potassium (K\u207a)", "4.3", "mEq/L", "3.5 - 5.0", "Normal"),
    ])

    # ─── Section 3: Lipid ───
    make_table("3. LIPID PANEL (Fasting)", [
        ("Total Cholesterol", "240", "mg/dL", "< 200", "HIGH"),
        ("LDL Cholesterol", "160", "mg/dL", "< 100", "HIGH"),
        ("HDL Cholesterol", "42", "mg/dL", "> 40", "Normal"),
        ("Triglycerides", "190", "mg/dL", "< 150", "HIGH"),
        ("VLDL", "38", "mg/dL", "5 - 40", "Borderline"),
    ])

    # ─── Section 4: Thyroid ───
    make_table("4. THYROID PROFILE", [
        ("TSH", "3.8", "mIU/L", "0.4 - 4.0", "Normal"),
        ("Free T3", "2.8", "pg/mL", "2.0 - 4.4", "Normal"),
        ("Free T4", "1.1", "ng/dL", "0.8 - 1.8", "Normal"),
    ])

    # ─── Clinical Impression ───
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceAfter=8))
    elements.append(Paragraph("<b>CLINICAL IMPRESSION & RECOMMENDATIONS</b>",
                               ParagraphStyle('ci', parent=styles['Heading2'],
                                              fontSize=13, textColor=PRIMARY, spaceAfter=6)))
    elements.append(Spacer(1, 4))

    findings = [
        ("1) Leukocytosis (WBC 12.8 x10\u00b3/\u00b5L)",
         "Elevated WBC suggests mild infection or inflammation. Monitor for fever or localized symptoms. CBC repeat in 1 week recommended."),
        ("2) Pre-Diabetes (FBS 110, HbA1c 6.1%)",
         "Fasting glucose and HbA1c in pre-diabetic range. Lifestyle modifications (diet + exercise), follow-up HbA1c in 3 months."),
        ("3) Dyslipidemia (TC 240, LDL 160, TG 190)",
         "Significantly elevated lipid profile. Dietary changes, regular exercise, and consider statin therapy after physician consultation."),
        ("4) Borderline BUN (20 mg/dL)",
         "Ensure adequate hydration (2-3L water daily). Re-check kidney function in next panel."),
    ]
    for title, desc in findings:
        elements.append(Paragraph(f"<b>{title}</b>", imp_style))
        elements.append(Paragraph(f"&nbsp;&nbsp;&nbsp;&nbsp;{desc}", imp_style))
        elements.append(Spacer(1, 4))

    # ─── Doctor Signature ───
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="45%", thickness=0.5, color=colors.gray, spaceAfter=3))
    elements.append(Paragraph("<b>Dr. Sarah Mehta, MD (Pathology)</b>",
                               ParagraphStyle('sig', parent=styles['Normal'], fontSize=11, textColor='#333')))
    elements.append(Paragraph("Chief Pathologist  |  City Diagnostics, New Delhi", small_style))
    elements.append(Paragraph("Reg. No: NMC-47821  |  Date: 05 Apr 2026", small_style))

    # ─── Footer ───
    elements.append(Spacer(1, 12))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray, spaceAfter=4))
    elements.append(Paragraph(
        "This report is for informational purposes only. Please correlate findings with clinical symptoms. Consult a qualified healthcare professional for diagnosis and treatment.",
        ParagraphStyle('footer', parent=styles['Normal'], fontSize=7, textColor=colors.gray, alignment=TA_CENTER)))

    doc.build(elements)
    buf.seek(0)

    out_path = os.path.join(OUTPUT_DIR, "Obvis_BloodReport_JohnDoe_2026-04-05.pdf")
    with open(out_path, "wb") as f:
        f.write(buf.read())

    print(f"\nPDF Created: {out_path}")
    print(f"File size: {os.path.getsize(out_path)} bytes")
    print("\nAb isko obvis.me/upload pe upload karo — AI analyze karke summary, suggestions, medicine sab dega.")
    return out_path


if __name__ == "__main__":
    create_report()
