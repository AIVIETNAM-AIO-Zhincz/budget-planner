"""Test event bus in-process (Event-Driven Architecture)."""

from dataclasses import dataclass

from app.events.bus import EventBus
from app.events.events import Event


@dataclass(frozen=True)
class _Ping(Event):
    msg: str = ""


def test_subscribe_and_publish_calls_handler() -> None:
    bus = EventBus()
    received: list[str] = []
    bus.subscribe(_Ping, lambda e: received.append(e.msg))

    bus.publish(_Ping(msg="hello"))

    assert received == ["hello"]


def test_multiple_handlers_all_called() -> None:
    bus = EventBus()
    calls: list[str] = []
    bus.subscribe(_Ping, lambda e: calls.append("a"))
    bus.subscribe(_Ping, lambda e: calls.append("b"))

    bus.publish(_Ping(msg="x"))

    assert sorted(calls) == ["a", "b"]


def test_handler_only_receives_subscribed_type() -> None:
    bus = EventBus()
    calls: list[str] = []
    bus.subscribe(_Ping, lambda e: calls.append("ping"))

    bus.publish(Event())  # loại khác, không có handler

    assert calls == []


def test_failing_handler_does_not_break_others() -> None:
    """Một handler lỗi không được làm hỏng các handler còn lại."""
    bus = EventBus()
    calls: list[str] = []

    def boom(_e: _Ping) -> None:
        raise RuntimeError("handler lỗi")

    bus.subscribe(_Ping, boom)
    bus.subscribe(_Ping, lambda e: calls.append("ok"))

    bus.publish(_Ping(msg="x"))  # không raise

    assert calls == ["ok"]
