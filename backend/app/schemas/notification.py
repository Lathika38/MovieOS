from typing import Optional, Any
from pydantic import BaseModel, field_validator

def sanitize_date(v: Any) -> Optional[str]:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)

class NotificationCreate(BaseModel):
    userId: Optional[str] = "ALL"
    senderId: Optional[str] = "SYSTEM"
    senderName: Optional[str] = "MovieOS System"
    senderRole: Optional[str] = "SYSTEM"
    movieId: Optional[str] = None
    movieTitle: Optional[str] = None
    type: Optional[str] = "GENERAL"
    title: str
    message: str
    actionUrl: Optional[str] = None
    metadata: Optional[dict] = {}

class NotificationResponse(NotificationCreate):
    id: str
    isRead: Optional[bool] = False
    createdAt: Optional[Any] = None

    @field_validator("createdAt", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)

class BroadcastAnnouncement(BaseModel):
    movieId: Optional[str] = "ALL"
    senderId: Optional[str] = "ADMIN"
    senderName: Optional[str] = "Studio Admin"
    senderRole: Optional[str] = "ADMIN"
    targetRole: Optional[str] = "ALL"
    title: str
    message: str

class MessageCreate(BaseModel):
    movieId: Optional[str] = "ALL"
    roomId: Optional[str] = "general"
    senderId: Optional[str] = "SYSTEM"
    senderName: Optional[str] = "System"
    senderRole: Optional[str] = "SYSTEM"
    recipientId: Optional[str] = None
    content: str

class MessageResponse(MessageCreate):
    id: str
    createdAt: Optional[Any] = None
    timestamp: Optional[Any] = None

    @field_validator("createdAt", "timestamp", mode="before")
    @classmethod
    def val_dates(cls, v):
        return sanitize_date(v)
