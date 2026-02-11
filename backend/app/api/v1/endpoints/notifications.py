from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin
from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationListResponse, NotificationResponse

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    query = select(Notification)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))
    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    items = (await db.execute(query)).scalars().all()

    total_query = select(func.count(Notification.id))
    if unread_only:
        total_query = total_query.where(Notification.is_read.is_(False))
    total = (await db.execute(total_query)).scalar() or 0
    unread = (
        await db.execute(select(func.count(Notification.id)).where(Notification.is_read.is_(False)))
    ).scalar() or 0

    return {"total": total, "unread": unread, "items": items}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    notification = (
        await db.execute(select(Notification).where(Notification.id == notification_id))
    ).scalar_one_or_none()
    if notification is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    rows = (await db.execute(select(Notification).where(Notification.is_read.is_(False)))).scalars().all()
    for item in rows:
        item.is_read = True
    await db.commit()
