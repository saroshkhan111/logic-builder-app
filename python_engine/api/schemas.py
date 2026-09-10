"""Pydantic request/response schemas for the engine API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FlowNode(BaseModel):
    """A reactflow-style node in a logic flow."""

    id: str
    type: str = "default"
    label: str | None = None
    data: dict[str, object] = Field(default_factory=dict)


class FlowEdge(BaseModel):
    """A directed connection between two nodes."""

    source: str
    target: str
    id: str | None = None


class FlowValidationRequest(BaseModel):
    nodes: list[FlowNode]
    edges: list[FlowEdge]


class ValidationIssueModel(BaseModel):
    node_id: str | None = None
    message: str
    severity: str = "error"


class FlowValidationResponse(BaseModel):
    valid: bool
    issues: list[ValidationIssueModel]
    error_count: int
    warning_count: int


class PEP8Request(BaseModel):
    source: str = Field(min_length=0, max_length=100_000)


class PEP8Response(BaseModel):
    issues: list[dict[str, object]]
    issue_count: int
