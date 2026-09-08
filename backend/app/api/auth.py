import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status
from app.core.database import db
from app.schemas.auth import UserRegister, UserLogin, UserResponse, UserProfileUpdate
from app.schemas.common import ApiResponse, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication & Roles"])

@router.post("/register", response_model=ApiResponse[UserResponse])
def register_user(payload: UserRegister):
    email_clean = str(payload.email).lower().strip()
    existing = db.query_collection("users", filters=[("email", "==", email_clean)])
    if existing:
        return ApiResponse(
            success=True,
            message=f"Welcome back, {existing[0].get('name')}.",
            data=UserResponse(**existing[0])
        )

    user_id = str(uuid.uuid4())
    user_data = payload.model_dump()
    user_data["id"] = user_id
    user_data["email"] = email_clean
    user_data["filmography"] = []
    user_data["createdAt"] = datetime.now(timezone.utc).isoformat()
    user_data["updatedAt"] = datetime.now(timezone.utc).isoformat()

    created = db.set_document("users", user_id, user_data)
    return ApiResponse(
        success=True,
        message=f"User {payload.name} registered successfully with role {payload.role}.",
        data=UserResponse(**created)
    )

@router.post("/login", response_model=ApiResponse[UserResponse])
def login_user(payload: UserLogin):
    email_clean = str(payload.email).lower().strip()
    users = db.query_collection("users", filters=[("email", "==", email_clean)])
    if not users:
        user_id = str(uuid.uuid4())
        name = email_clean.split("@")[0].capitalize()
        user_data = {
            "id": user_id,
            "email": email_clean,
            "name": name,
            "role": "DIRECTOR",
            "filmography": [],
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat()
        }
        created = db.set_document("users", user_id, user_data)
        return ApiResponse(
            success=True,
            message=f"Welcome to MovieOS, {name}.",
            data=UserResponse(**created)
        )

    user = users[0]
    return ApiResponse(
        success=True,
        message=f"Welcome back, {user.get('name')} ({user.get('role')}).",
        data=UserResponse(**user)
    )

@router.get("/me/{user_id}", response_model=ApiResponse[UserResponse])
def get_user_profile(user_id: str):
    user = db.get_document("users", user_id)
    if not user:
        users = db.query_collection("users", limit=1)
        if users:
            return ApiResponse(success=True, data=UserResponse(**users[0]))
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")
    return ApiResponse(success=True, data=UserResponse(**user))

@router.put("/profile/{user_id}", response_model=ApiResponse[UserResponse])
def update_user_profile(user_id: str, updates: UserProfileUpdate):
    user = db.get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found.")
    
    update_dict = {k: v for k, v in updates.model_dump().items() if v is not None}
    updated = db.update_document("users", user_id, update_dict)
    return ApiResponse(success=True, message="Profile updated successfully.", data=UserResponse(**updated))

@router.get("/users", response_model=ApiResponse[List[UserResponse]])
def get_all_users():
    users = db.query_collection("users")
    return ApiResponse(success=True, data=[UserResponse(**u) for u in users])

@router.patch("/users/{user_id}/role", response_model=ApiResponse[UserResponse])
def update_user_role(user_id: str, role: str):
    user = db.get_document("users", user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    updated = db.update_document("users", user_id, {"role": role, "updatedAt": datetime.now(timezone.utc).isoformat()})
    return ApiResponse(success=True, message=f"Role updated to {role}", data=UserResponse(**updated))
