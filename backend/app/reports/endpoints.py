import os, json, uuid, time, io, asyncio
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable, Image as PlatypusImage
from reportlab.lib.units import mm

from app.database import get_db
from app.models.user import User
from app.models.report import Report
from app.core.security import get_current_user
from app.config import settings, ALLOWED_EXTENSIONS
from app.services.openai_client import analyze_report_image, analyze_report_pdf

router = APIRouter(prefix="/reports", tags=["reports"])


async def _run_analysis(file_path: str, file_type: str, original_name: str, report_id: str):
    """Background task: analyze AI without blocking upload."""
    from app.database import engine
    from app.database import async_session as _get_async_session

    try:
        content = open(file_path, "rb").read()
        if file_type == "pdf":
            analysis = await analyze_report_pdf(content, original_name)
        else:
            analysis = await analyze_report_image(file_path, original_name)

        async with _get_async_session() as session:
            result = await session.execute(
                select(Report).where(Report.id == report_id)
            )
            rpt = result.scalar_one_or_none()
            if rpt:
                rpt.status = "completed"
                rpt.analysis_summary = analysis.get("summary", "")
                rpt.analysis_data = json.dumps(analysis, ensure_ascii=False)
                await session.commit()
        print(f"Analysis completed for report {report_id}")
    except Exception as e:
        print(f"Background analysis failed for report {report_id}: {e}")
        async with _get_async_session() as session:
            result = await session.execute(
                select(Report).where(Report.id == report_id)
            )
            rpt = result.scalar_one_or_none()
            if rpt:
                rpt.status = "failed"
                await session.commit()


@router.get("", response_model=list[dict])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report)
        .where(Report.user_id == user.id)
        .order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()
    return [
        {
            "id": r.id,
            "name": r.original_name,
            "status": r.status,
            "uploaded_at": r.created_at.isoformat(),
            "file_name": r.file_name,
            "analyzed": r.status == "completed",
        }
        for r in reports
    ]


@router.post("/upload", response_model=dict)
async def upload_report(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # validate extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"File type .{ext} not allowed")

    unique_name = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(settings.upload_dir, unique_name)
    os.makedirs(settings.upload_dir, exist_ok=True)

    # read and save
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    report = Report(
        user_id=user.id,
        file_name=unique_name,
        original_name=file.filename,
        file_type=ext,
        file_size=len(content),
        status="pending",
        analysis_summary=None,
        analysis_data=None,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)

    # Analyze in background while streaming live CSS progress
    import traceback

    analysis_result: dict = {}
    analysis_done_event = asyncio.Event()
    analysis_error: str | None = None

    async def run_analysis():
        nonlocal analysis_result, analysis_error
        try:
            if ext == "pdf":
                r = await analyze_report_pdf(content, file.filename)
            else:
                r = await analyze_report_image(file_path, file.filename)
            analysis_result = r
            report.status = "completed"
            report.analysis_summary = r.get("summary", "")
            report.analysis_data = json.dumps(r, ensure_ascii=False)
            await db.commit()
        except Exception as e:
            print(f"Analysis failed: {e}")
            traceback.print_exc()
            analysis_error = str(e)
            report.status = "failed"
            await db.commit()
        finally:
            analysis_done_event.set()

    # Start AI analysis in background
    asyncio.ensure_future(run_analysis())

    async def generate_analysis():
        """Stream live CSS progress until analysis is done."""
        messages = (
            (20, "reading", "Extracting medical data..."),
            (35, "reading", "Parsing report structures..."),
            (50, "analyzing", "Analyzing test values..."),
            (60, "analyzing", "Cross-referencing medical databases..."),
            (70, "analyzing", "Identifying abnormal patterns..."),
            (80, "generating", "Generating health insights..."),
            (90, "generating", "Compiling final report..."),
        )

        for progress, status, message in messages:
            if analysis_done_event.is_set():
                break
            yield f"data: {json.dumps({'status': status, 'message': message, 'progress': progress})}\n\n"
            # Wait between steps (or until done, whichever is faster)
            try:
                await asyncio.wait_for(analysis_done_event.wait(), timeout=2.5)
            except asyncio.TimeoutError:
                pass

        # Wait for final result
        await analysis_done_event.wait()
        yield f"data: {json.dumps({'status': 'reading', 'message': 'Finalizing...', 'progress': 95})}\n\n"
        await asyncio.sleep(0.2)

        if analysis_error:
            yield f"data: {json.dumps({'status': 'failed', 'message': f'Analysis failed: {analysis_error}', 'progress': 0})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'completed', 'message': 'Analysis complete!', 'progress': 100, 'analysis': analysis_result})}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(generate_analysis(), media_type="text/event-stream")


@router.post("/{report_id}/analyze", response_model=dict)
async def analyze_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")

    if report.status == "completed":
        return json.loads(report.analysis_data)

    # re-analyze if pending/failed
    file_path = os.path.join(settings.upload_dir, report.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on server")

    with open(file_path, "rb") as f:
        content = f.read()

    try:
        analysis = None
        if report.file_type == "pdf":
            analysis = await analyze_report_pdf(content, report.original_name)
        else:
            analysis = await analyze_report_image(file_path, report.original_name)

        report.status = "completed"
        report.analysis_summary = analysis.get("summary", "")
        report.analysis_data = json.dumps(analysis, ensure_ascii=False)
        await db.commit()
        return analysis
    except Exception as e:
        report.status = "failed"
        await db.commit()
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@router.get("/{report_id}/download")
async def download_original_file(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Download the originally uploaded file."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")

    file_path = os.path.join(settings.upload_dir, report.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found on server")

    media_type = "application/pdf" if report.file_type == "pdf" else f"image/{report.file_type}"
    return FileResponse(file_path, filename=report.original_name, media_type=media_type)


@router.get("/{report_id}/download-analysis")
async def download_analysis_pdf(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate and download the analysis as a formatted PDF."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.user_id == user.id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")

    if report.status != "completed" or not report.analysis_data:
        raise HTTPException(400, "Analysis not available yet")

    try:
        analysis = json.loads(report.analysis_data)
    except (json.JSONDecodeError, TypeError):
        raise HTTPException(500, "Corrupted analysis data")

    # Build analysis PDF
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4,
                            topMargin=25, bottomMargin=25,
                            leftMargin=35, rightMargin=35)
    styles = getSampleStyleSheet()
    elements = []

    PRIMARY = colors.HexColor("#0d3b66")
    ACCENT = colors.HexColor("#0ea5e9")
    LIGHT_BG = colors.HexColor("#eef6fc")

    # Header
    elements.append(Paragraph("<b>OBVIS AI — ANALYSIS REPORT</b>",
                               ParagraphStyle('ht', parent=styles['Normal'],
                                              fontSize=18, textColor=PRIMARY, alignment=1)))
    elements.append(Paragraph(f"Original File: {report.original_name}",
                               ParagraphStyle('hs', parent=styles['Normal'],
                                              fontSize=9, textColor=colors.gray, alignment=1)))
    elements.append(Paragraph(f"Analyzed: {datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p')}",
                               ParagraphStyle('hd', parent=styles['Normal'],
                                              fontSize=9, textColor=colors.gray, alignment=1)))
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT, spaceAfter=10))

    summary_style = ParagraphStyle('sum', parent=styles['Normal'], fontSize=11, leading=15)

    # Summary
    elements.append(Paragraph("<b>SUMMARY</b>", styles['Heading2']))
    elements.append(Paragraph(analysis.get('summary', ''), summary_style))
    elements.append(Spacer(1, 15))

    # Abnormal values
    values = analysis.get('values', [])
    abnormal = [v for v in values if v.get('flag', '').upper() in ['HIGH', 'LOW', 'BORDERLINE']]
    if abnormal:
        elements.append(Paragraph("<b>ABNORMAL VALUES</b>", styles['Heading2']))
        elements.append(Spacer(1, 5))
        tdata = [["Test", "Result", "Unit", "Reference Range", "Flag"]]
        for v in abnormal:
            flag = v.get('flag', '')
            flag_display = flag if flag in ['NORMAL', 'NORMAL', 'Normal', 'normal'] else flag.upper()
            tdata.append([v['name'], v['value'], v.get('unit', ''), v.get('normal_range', ''), flag_display])

        tab = Table(tdata, colWidths=[130, 70, 45, 85, 55])
        tab.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#ccc')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ]))
        elements.append(tab)
        elements.append(Spacer(1, 10))

    # Precautions
    precautions = analysis.get('precautions', [])
    if precautions:
        elements.append(Paragraph("<b>PRECAUTIONS</b>", styles['Heading2']))
        for p in precautions:
            elements.append(Paragraph(f"• {p}", styles['Normal']))
        elements.append(Spacer(1, 10))

    # Lifestyle tips
    tips = analysis.get('lifestyle_tips', [])
    if tips:
        elements.append(Paragraph("<b>LIFESTYLE SUGGESTIONS</b>", styles['Heading2']))
        for t in tips:
            elements.append(Paragraph(f"• {t}", styles['Normal']))
        elements.append(Spacer(1, 10))

    # Medicine suggestions
    meds = analysis.get('medicine_suggestions', [])
    if meds:
        elements.append(Paragraph("<b>MEDICINE SUGGESTIONS</b>", styles['Heading2']))
        for m in meds:
            elements.append(Paragraph(f"• {m}", styles['Normal']))
        elements.append(Spacer(1, 10))

    # Footer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.gray, spaceAfter=5))
    elements.append(Paragraph(
        "Disclaimer: This is an AI-generated analysis. Please consult a qualified healthcare professional for proper diagnosis and treatment.",
        ParagraphStyle('ft', parent=styles['Normal'], fontSize=7, textColor=colors.gray, alignment=1, fontName='Helvetica-Oblique')
    ))

    doc.build(elements)
    buf.seek(0)

    filename = f"Analysis_{report.original_name.rsplit('.', 1)[0]}.pdf"
    return StreamingResponse(buf, media_type="application/pdf",
                              headers={"Content-Disposition": f"attachment; filename={filename}"})
