from typing import List, Optional, Any
from pydantic import BaseModel, model_validator
from app.schemas.common import TrackStatus

def sanitize_date(v: Any) -> Optional[str]:
    if v is None:
        return None
    if hasattr(v, "isoformat"):
        return v.isoformat()
    return str(v)

class MusicTrackCreate(BaseModel):
    movieId: str
    musicProjectId: Optional[str] = None
    title: str
    trackType: Optional[str] = "SCORE_CUE" # THEME, BGM, SONG, TEASER, SOUND_DESIGN, SCORE_CUE
    sceneNumber: Optional[int] = None
    characterName: Optional[str] = None
    mood: Optional[str] = "Cinematic" # Ethereal, Tense, Heroic, Melancholic, Action, Romantic
    moodTags: Optional[List[str]] = []
    bpm: Optional[int] = 120
    keySignature: Optional[str] = "C Minor"
    musicalKey: Optional[str] = "C Minor"
    durationSeconds: Optional[int] = 180
    audioUrl: Optional[str] = None
    waveformPeaks: Optional[List[float]] = []
    instrumentsUsed: Optional[List[str]] = []
    instrumentation: Optional[List[str]] = []
    notes: Optional[str] = None
    description: Optional[str] = None
    status: Any = "DRAFT"

    @model_validator(mode='before')
    @classmethod
    def sanitize_track_create(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("mood"):
                tags = data.get("moodTags")
                data["mood"] = ", ".join(tags) if isinstance(tags, list) and tags else "Cinematic"
            if not data.get("keySignature") and data.get("musicalKey"):
                data["keySignature"] = data.get("musicalKey")
            if not data.get("instrumentsUsed") and data.get("instrumentation"):
                data["instrumentsUsed"] = data.get("instrumentation")
            if not data.get("notes") and data.get("description"):
                data["notes"] = data.get("description")
        return data

class MusicTrackResponse(MusicTrackCreate):
    id: str
    directorFeedback: Optional[str] = None
    directorRating: Optional[int] = None
    submittedAt: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def sanitize_track_response(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ["submittedAt", "createdAt", "updatedAt"]:
                val = data.get(field)
                if val is not None and not isinstance(val, str):
                    if hasattr(val, "isoformat"):
                        data[field] = val.isoformat()
                    else:
                        data[field] = str(val)
            if not data.get("id"):
                data["id"] = data.get("_id") or "trk-default"
            if not data.get("mood"):
                tags = data.get("moodTags")
                data["mood"] = ", ".join(tags) if isinstance(tags, list) and tags else "Cinematic"
            if not data.get("keySignature") and data.get("musicalKey"):
                data["keySignature"] = data.get("musicalKey")
            if not data.get("instrumentsUsed") and data.get("instrumentation"):
                data["instrumentsUsed"] = data.get("instrumentation")
        return data

class MusicThemeCreate(BaseModel):
    movieId: str
    name: Optional[str] = "Theme Motif"
    themeName: Optional[str] = None
    characterName: Optional[str] = None
    concept: Optional[str] = "Original Leitmotif"
    dramaticMeaning: Optional[str] = None
    primaryInstruments: Optional[List[str]] = []
    instrumentation: Optional[List[str]] = []
    scaleOrMode: Optional[str] = "Dorian"
    musicalKey: Optional[str] = "A Minor"
    tempoRange: Optional[str] = "90-110 BPM"
    tempoBpm: Optional[int] = 90
    audioSnippetUrl: Optional[str] = None
    audioUrl: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def sanitize_theme_create(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if not data.get("name") and data.get("themeName"):
                data["name"] = data.get("themeName")
            if not data.get("concept") and data.get("dramaticMeaning"):
                data["concept"] = data.get("dramaticMeaning")
            if not data.get("primaryInstruments") and data.get("instrumentation"):
                data["primaryInstruments"] = data.get("instrumentation")
            if not data.get("audioSnippetUrl") and data.get("audioUrl"):
                data["audioSnippetUrl"] = data.get("audioUrl")
        return data

class MusicThemeResponse(MusicThemeCreate):
    id: str
    createdAt: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def sanitize_theme_response(cls, data: Any) -> Any:
        if isinstance(data, dict):
            val = data.get("createdAt")
            if val is not None and not isinstance(val, str):
                if hasattr(val, "isoformat"):
                    data["createdAt"] = val.isoformat()
                else:
                    data["createdAt"] = str(val)
            if not data.get("id"):
                data["id"] = data.get("_id") or "thm-default"
        return data

class MusicProjectCreate(BaseModel):
    movieId: str
    musicDirectorId: Optional[str] = "USR-MUSIC-001"
    overview: Optional[str] = "Original Film Score Project"
    sonicPalette: Optional[str] = None
    targetDeliveryDate: Optional[str] = None

class MusicProjectResponse(MusicProjectCreate):
    id: str
    totalCues: int = 0
    approvedCues: int = 0
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def sanitize_proj_response(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ["createdAt", "updatedAt"]:
                val = data.get(field)
                if val is not None and not isinstance(val, str):
                    if hasattr(val, "isoformat"):
                        data[field] = val.isoformat()
                    else:
                        data[field] = str(val)
            if not data.get("id"):
                data["id"] = data.get("_id") or "prj-default"
        return data

class MusicReviewSubmit(BaseModel):
    trackId: str
    status: Any = "APPROVED" # APPROVED or REVISION_REQUESTED
    feedback: Optional[str] = "Approved by Director"
    rating: Optional[int] = 5
