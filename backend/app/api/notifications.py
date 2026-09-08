import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from app.core.database import db
from app.schemas.notification import (
    NotificationCreate, NotificationResponse, BroadcastAnnouncement, MessageCreate, MessageResponse
)
from app.schemas.common import ApiResponse

router = APIRouter(prefix="/notifications", tags=["Notifications & Real-time Alerts"])

@router.get("", response_model=ApiResponse[List[NotificationResponse]])
@router.get("/", response_model=ApiResponse[List[NotificationResponse]])
@router.get("/user/{user_id}", response_model=ApiResponse[List[NotificationResponse]])
def get_user_notifications(user_id: Optional[str] = None):
    # If not provided in path, will be captured from query params
    if not user_id:
        return ApiResponse(success=True, data=[])

    user_doc = db.get_document("users", user_id)
    user_email = user_doc.get("email") if user_doc else None
    user_role = user_doc.get("role") if user_doc else None

    # 1. Fetch direct userId notifications
    direct_notifs = db.query_collection("notifications", filters=[("userId", "==", user_id)], order_by="createdAt", descending=True)
    
    # 2. Fetch email or role broadcast notifications
    all_notifs = db.query_collection("notifications", order_by="createdAt", descending=True)
    
    combined = []
    seen_ids = set()

    for n in (direct_notifs + all_notifs):
        n_id = n.get("id")
        if n_id in seen_ids:
            continue

        target_u = n.get("userId")
        target_role = n.get("targetRole", "")
        
        is_match = False
        if target_u == user_id:
            is_match = True
        elif user_email and (target_u == user_email or n.get("recipientEmail") == user_email):
            is_match = True
        elif target_role == "ALL":
            is_match = True
        elif user_role and (target_role == user_role or (user_role == "DIRECTOR" and "DIRECTOR" in str(n.get("title", "")).upper())):
            is_match = True
        elif user_role == "DIRECTOR" and n.get("type") in ["CASTING_RESPONSE", "CASTING_ACCEPTED"]:
            is_match = True

        if is_match:
            seen_ids.add(n_id)
            combined.append(NotificationResponse(**n))

    return ApiResponse(success=True, data=combined)

@router.patch("/{notif_id}/read", response_model=ApiResponse[bool])
def mark_notification_read(notif_id: str):
    updated = db.update_document("notifications", notif_id, {"isRead": True})
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    return ApiResponse(success=True, data=True)

@router.post("/broadcast", response_model=ApiResponse[NotificationResponse])
def send_broadcast_notification(announcement: BroadcastAnnouncement):
    notif_id = f"notif-bcast-{uuid.uuid4().hex[:8]}"
    doc = {
        "id": notif_id,
        "title": announcement.title,
        "message": announcement.message,
        "type": "ANNOUNCEMENT",
        "targetRole": announcement.targetRole,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc).isoformat()
    }
    db.set_document("notifications", notif_id, doc)
    return ApiResponse(success=True, data=NotificationResponse(**doc))

@router.get("/messages/{room_id}", response_model=ApiResponse[List[MessageResponse]])
def get_room_messages(room_id: str):
    msgs = db.query_collection("messages", filters=[("roomId", "==", room_id)], order_by="timestamp", descending=False)
    return ApiResponse(success=True, data=[MessageResponse(**m) for m in msgs])

@router.post("/messages", response_model=ApiResponse[MessageResponse])
def post_chat_message(msg: MessageCreate):
    msg_id = f"msg-{uuid.uuid4().hex[:8]}"
    doc = {
        "id": msg_id,
        "roomId": msg.roomId,
        "senderId": msg.senderId,
        "senderName": msg.senderName,
        "senderRole": msg.senderRole,
        "content": msg.content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db.set_document("messages", msg_id, doc)
    return ApiResponse(success=True, data=MessageResponse(**doc))
