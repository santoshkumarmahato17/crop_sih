from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.schemas.common import BaseSchema


class AssistantChatRequest(BaseModel):
    """Payload to query the Agricultural AI Assistant."""

    message: str = Field(min_length=2, max_length=1000, description="Farmer query in English or Tamil")
    farm_id: Optional[str] = None
    zone_id: Optional[str] = None
    language: str = Field(default="en", description="en (English) or ta (Tamil)")


class AssistantChatResponse(BaseSchema):
    """Grounded, factual response synthesized from verified backend telemetry."""

    response_text: str
    language: str
    tools_used: List[str]
    data_sources: List[Dict[str, Any]]
    disclaimer: str = "Assistant responses are synthesized from verified PostGIS and AI model telemetry without hallucination."


class AssistantToolInfo(BaseSchema):
    """Metadata for registered internal query tools."""

    name: str
    description: str
    parameters: List[str]
