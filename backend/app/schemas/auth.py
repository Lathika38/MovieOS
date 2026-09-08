from typing import List, Optional, Any
from pydantic import BaseModel, EmailStr, model_validator
from app.schemas.common import UserRole

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Any = UserRole.DIRECTOR
    bio: Optional[str] = ""
    phone: Optional[str] = ""
    avatarUrl: Optional[str] = ""
    skills: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    genres: Optional[List[str]] = []
    showreelUrl: Optional[str] = ""
    achievements: Optional[List[str]] = []
    availability: Optional[str] = "Available"
    productionCompany: Optional[str] = ""
    guildStatus: Optional[str] = ""
    cameraPackage: Optional[str] = ""
    dawSetup: Optional[str] = ""
    instrumentPalette: Optional[str] = ""

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[Any] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    avatarUrl: Optional[str] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[str]] = None
    genres: Optional[List[str]] = None
    showreelUrl: Optional[str] = None
    achievements: Optional[List[str]] = None
    availability: Optional[str] = None
    productionCompany: Optional[str] = None
    guildStatus: Optional[str] = None
    cameraPackage: Optional[str] = None
    dawSetup: Optional[str] = None
    instrumentPalette: Optional[str] = None

class FilmographyItem(BaseModel):
    movieId: str
    movieTitle: str
    releaseYear: int
    characterName: str
    roleType: str
    genre: str
    directorName: Optional[str] = None
    status: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: Any = "DIRECTOR"
    bio: Optional[str] = ""
    phone: Optional[str] = ""
    avatarUrl: Optional[str] = ""
    skills: Optional[List[str]] = []
    languages: Optional[List[str]] = []
    genres: Optional[List[str]] = []
    showreelUrl: Optional[str] = ""
    achievements: Optional[List[str]] = []
    availability: Optional[str] = "Available"
    productionCompany: Optional[str] = ""
    guildStatus: Optional[str] = ""
    cameraPackage: Optional[str] = ""
    dawSetup: Optional[str] = ""
    instrumentPalette: Optional[str] = ""
    filmography: Optional[List[Any]] = []
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def sanitize_user_data(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ["createdAt", "updatedAt", "lastLoginAt"]:
                val = data.get(field)
                if val is not None and not isinstance(val, str):
                    if hasattr(val, "isoformat"):
                        data[field] = val.isoformat()
                    else:
                        data[field] = str(val)
            if not data.get("name"):
                data["name"] = data.get("displayName") or (data.get("email", "").split("@")[0] if data.get("email") else "Filmmaker")
            
            raw_role = str(data.get("role", "DIRECTOR")).upper()
            role_map = {
                "PRODUCER": "PRODUCER",
                "DIRECTOR": "DIRECTOR",
                "ACTOR": "ACTOR",
                "MUSIC_DIRECTOR": "MUSIC_DIRECTOR",
                "MUSIC": "MUSIC_DIRECTOR",
                "ADMIN": "ADMIN",
                "USER": "ACTOR"
            }
            data["role"] = role_map.get(raw_role, "DIRECTOR")
            
            if not data.get("id"):
                data["id"] = data.get("uid") or data.get("_id") or "user-default"
        return data
