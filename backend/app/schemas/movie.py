from typing import List, Optional, Any, Union
from pydantic import BaseModel, field_validator
from app.schemas.common import MovieStatus

def sanitize_string_or_list(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return ", ".join(str(x) for x in v)
    return str(v)

def sanitize_date(v: Any) -> Optional[str]:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)

class MovieMember(BaseModel):
    userId: Optional[str] = None
    name: Optional[str] = "Crew Member"
    role: Optional[str] = "MEMBER"
    characterName: Optional[str] = None
    joinedAt: Optional[str] = None

    @field_validator("joinedAt", mode="before")
    @classmethod
    def val_joined(cls, v):
        return sanitize_date(v)

class MovieCreate(BaseModel):
    title: str
    genre: Optional[Union[str, List[str]]] = "Drama"
    language: Optional[str] = "Tamil"
    logline: Optional[str] = ""
    synopsis: Optional[str] = ""
    producerId: Optional[str] = None
    directorId: Optional[str] = None
    musicDirectorId: Optional[str] = None
    createdBy: Optional[str] = None
    status: Optional[Any] = MovieStatus.DEVELOPMENT
    budget: Optional[float] = 0.0
    totalBudget: Optional[float] = 0.0
    startDate: Optional[Any] = None
    endDate: Optional[Any] = None
    releaseDate: Optional[Any] = None
    posterUrl: Optional[str] = None
    targetAudience: Optional[str] = None
    productionCompany: Optional[str] = None

    @field_validator("genre", mode="before")
    @classmethod
    def val_genre(cls, v):
        return sanitize_string_or_list(v) or "Drama"

    @field_validator("logline", "synopsis", "language", "productionCompany", mode="before")
    @classmethod
    def val_strs(cls, v):
        return sanitize_string_or_list(v)

    @field_validator("startDate", "endDate", "releaseDate", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[Union[str, List[str]]] = None
    language: Optional[str] = None
    logline: Optional[str] = None
    synopsis: Optional[str] = None
    producerId: Optional[str] = None
    directorId: Optional[str] = None
    musicDirectorId: Optional[str] = None
    createdBy: Optional[str] = None
    status: Optional[Any] = None
    budget: Optional[float] = None
    totalBudget: Optional[float] = None
    startDate: Optional[Any] = None
    endDate: Optional[Any] = None
    releaseDate: Optional[Any] = None
    posterUrl: Optional[str] = None
    targetAudience: Optional[str] = None
    productionCompany: Optional[str] = None

    @field_validator("genre", mode="before")
    @classmethod
    def val_genre(cls, v):
        if v is None: return None
        return sanitize_string_or_list(v)

    @field_validator("startDate", "endDate", "releaseDate", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)

class MovieResponse(BaseModel):
    id: str
    title: str = "Untitled Cinema Project"
    genre: Union[str, List[str]] = "Drama"
    language: Optional[str] = "Tamil"
    logline: Optional[str] = ""
    synopsis: Optional[str] = ""
    producerId: Optional[str] = None
    producerName: Optional[str] = None
    directorId: Optional[str] = None
    directorName: Optional[str] = None
    musicDirectorId: Optional[str] = None
    musicDirectorName: Optional[str] = None
    createdBy: Optional[str] = None
    status: Optional[Any] = MovieStatus.DEVELOPMENT
    budget: Optional[float] = 0.0
    totalBudget: Optional[float] = 0.0
    spentBudget: Optional[float] = 0.0
    startDate: Optional[Any] = None
    endDate: Optional[Any] = None
    releaseDate: Optional[Any] = None
    posterUrl: Optional[str] = None
    targetAudience: Optional[str] = None
    productionCompany: Optional[str] = None
    members: Optional[List[Any]] = []
    totalScenes: Optional[int] = 0
    completedScenes: Optional[int] = 0
    createdAt: Optional[Any] = None
    updatedAt: Optional[Any] = None

    @field_validator("genre", mode="before")
    @classmethod
    def val_genre(cls, v):
        return sanitize_string_or_list(v) or "Drama"

    @field_validator("logline", "synopsis", "language", "productionCompany", mode="before")
    @classmethod
    def val_strs(cls, v):
        return sanitize_string_or_list(v)

    @field_validator("createdAt", "updatedAt", "startDate", "endDate", "releaseDate", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)
