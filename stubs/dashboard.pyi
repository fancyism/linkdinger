"""Type stubs for dashboard module."""

from typing import Any

def start_dashboard(host: str = "127.0.0.1", port: int = 8080) -> None:
    """Start the dashboard server."""
    ...

def log_activity(event_type: str, message: str, details: str = "") -> None:
    """Log an activity event."""
    ...

def set_daemon_state(**kwargs: Any) -> None:
    """Update daemon state."""
    ...
