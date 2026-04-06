from pydantic import BaseModel

class ReportResponse(BaseModel):
    id: str
    name: str
    status: str
    uploaded_at: str
    analyzed: bool

    class Config:
        from_attributes = True
