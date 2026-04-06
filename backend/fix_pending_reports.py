"""Fix all pending/failed reports by re-running analysis."""
import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from app.database import engine, async_session, Base
from app.models.report import Report
from app.services.openai_client import analyze_report_image, analyze_report_pdf
from sqlalchemy import select


async def fix_reports():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        result = await db.execute(
            select(Report).where(Report.status.in_(["pending", "failed"]))
        )
        reports = result.scalars().all()

    if not reports:
        print("No pending/failed reports to fix.")
        return

    print(f"Found {len(reports)} reports to fix.\n")

    for report in reports:
        file_path = os.path.join("uploads", report.file_name)
        if not os.path.exists(file_path):
            print(f"[SKIP] {report.original_name} - file not found on disk")
            continue

        print(f"[FIXING] {report.original_name} ({report.file_type})...", end=" ")
        try:
            content = open(file_path, "rb").read()
            if report.file_type == "pdf":
                analysis = await analyze_report_pdf(content, report.original_name)
            else:
                analysis = await analyze_report_image(file_path, report.original_name)

            async with async_session() as db:
                result = await db.execute(select(Report).where(Report.id == report.id))
                rpt = result.scalar_one()
                rpt.status = "completed"
                rpt.analysis_summary = analysis.get("summary", "")
                rpt.analysis_data = json.dumps(analysis, ensure_ascii=False)
                await db.commit()

            print("OK")
        except Exception as e:
            print(f"FAILED - {e}")

    # Show final status
    async with async_session() as db:
        result = await db.execute(select(Report))
        all_reports = result.scalars().all()
        print(f"\nFinal status:")
        for r in all_reports:
            print(f"  [{r.status}] {r.original_name}")


asyncio.run(fix_reports())
