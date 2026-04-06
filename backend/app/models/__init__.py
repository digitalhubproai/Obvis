from app.models.user import User
from app.models.report import Report

# Wire up relationships (avoid import cycles)
User = User
Report = Report
