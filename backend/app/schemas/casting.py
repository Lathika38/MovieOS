from typing import List, Optional, Any
from pydantic import BaseModel, field_validator
from app.schemas.common import CastingStatus

def sanitize_date(v: Any) -> Optional[str]:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)

class CastingRequestCreate(BaseModel):
    movieId: str
    actorId: str
    characterId: Optional[str] = "CHR-001"
    characterName: str
    characterDescription: Optional[str] = "Key character role"
    roleType: Optional[str] = "Lead"
    offeredFee: Optional[float] = 0.0
    shootingDates: Optional[str] = None
    locations: Optional[str] = None
    roleRequirements: Optional[str] = None
    message: Optional[str] = None

class CastingStatusUpdate(BaseModel):
    status: CastingStatus
    actorResponseNote: Optional[str] = None

class CastingRequestResponse(BaseModel):
    id: str
    movieId: str
    movieTitle: Optional[str] = "Active Cinema Production"
    actorId: str
    actorName: Optional[str] = "Actor"
    actorEmail: Optional[str] = None
    directorId: Optional[str] = None
    directorName: Optional[str] = None
    producerId: Optional[str] = None
    characterId: Optional[str] = "CHR-001"
    characterName: str
    characterDescription: Optional[str] = ""
    roleType: Optional[str] = "Lead"
    offeredFee: Optional[float] = None
    shootingDates: Optional[str] = None
    locations: Optional[str] = None
    roleRequirements: Optional[str] = None
    message: Optional[str] = None
    status: Optional[Any] = CastingStatus.PENDING
    actorResponseNote: Optional[str] = None
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None

    @field_validator("createdAt", "updatedAt", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)
