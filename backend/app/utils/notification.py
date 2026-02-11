from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    *,
    order_id: int | None,
    type: str,
    title: str,
    content: str,
    channel: str = "in_app",
) -> Notification:
    notification = Notification(
        order_id=order_id,
        type=type,
        title=title,
        content=content,
        channel=channel,
    )
    db.add(notification)
    await db.flush()
    return notification
