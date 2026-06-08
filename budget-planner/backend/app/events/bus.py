"""Event bus in-process (Event-Driven Architecture).

Phase 0: đồng bộ, in-process. Giao diện (subscribe/publish) giữ nguyên khi
chuyển sang message broker thật (Kafka/RabbitMQ) ở giai đoạn sau.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from collections.abc import Callable

from app.events.events import Event

logger = logging.getLogger(__name__)

Handler = Callable[[Event], None]


class EventBus:
    """Bus publish/subscribe đơn giản, dispatch theo đúng loại event."""

    def __init__(self) -> None:
        self._subscribers: dict[type[Event], list[Handler]] = defaultdict(list)

    def subscribe(self, event_type: type[Event], handler: Handler) -> None:
        """Đăng ký ``handler`` cho một loại event."""
        self._subscribers[event_type].append(handler)

    def publish(self, event: Event) -> None:
        """Phát event tới mọi handler đã đăng ký cho đúng loại của nó.

        Một handler lỗi được log lại nhưng **không** làm hỏng các handler khác
        (cô lập lỗi — quan trọng trong kiến trúc hướng sự kiện).
        """
        for handler in self._subscribers[type(event)]:
            try:
                handler(event)
            except Exception:  # noqa: BLE001 - cô lập lỗi handler
                logger.exception("Event handler lỗi cho %s", type(event).__name__)


# Bus dùng chung toàn ứng dụng.
event_bus = EventBus()
