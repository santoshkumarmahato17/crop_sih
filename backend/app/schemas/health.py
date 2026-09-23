from datetime import datetime
from typing import Dict, Optional
from pydantic import BaseModel, Field


class SubsystemHealth(BaseModel):
    """Health indicator for an individual subsystem."""

    status: str = Field(description="Operational status (operational, degraded, unavailable)")
    latency_ms: Optional[float] = Field(default=None, description="Subsystem ping latency in milliseconds")
    details: Optional[str] = Field(default=None, description="Optional diagnostic details or error messages")


class HealthCheckResponse(BaseModel):
    """Comprehensive system health check report."""

    system: str = "KISAN SATHI"
    version: str
    environment: str
    status: str = Field(description="Overall system status (healthy, degraded, unhealthy)")
    timestamp: datetime
    subsystems: Dict[str, SubsystemHealth] = Field(default_factory=dict)
