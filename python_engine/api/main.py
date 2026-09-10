"""FastAPI entry point for the logic-builder Python engine."""

from __future__ import annotations

from fastapi import FastAPI

from python_engine import __version__
from python_engine.api.schemas import (
    FlowEdge,
    FlowNode,
    FlowValidationRequest,
    FlowValidationResponse,
    PEP8Request,
    PEP8Response,
    ValidationIssueModel,
)
from python_engine.core.pep8_parser import parse_pep8
from python_engine.core.validation import FlowValidator

app = FastAPI(
    title="Logic Builder Python Engine",
    description="Validation engines and PEP 8 parsing for logic-builder-app.",
    version=__version__,
)

validator = FlowValidator()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


@app.post("/validate/flow", response_model=FlowValidationResponse)
def validate_flow(request: FlowValidationRequest) -> FlowValidationResponse:
    result = validator.validate(
        [n.model_dump() for n in request.nodes],
        [e.model_dump() for e in request.edges],
    )
    return FlowValidationResponse(
        valid=result.valid,
        issues=[
            ValidationIssueModel(
                node_id=i.node_id,
                message=i.message,
                severity=i.severity,
            )
            for i in result.issues
        ],
        error_count=result.error_count,
        warning_count=result.warning_count,
    )


@app.post("/parse/pep8", response_model=PEP8Response)
def parse_pep8_endpoint(request: PEP8Request) -> PEP8Response:
    issues = parse_pep8(request.source)
    return PEP8Response(
        issues=[i.as_dict() for i in issues],  # type: ignore[arg-type]
        issue_count=len(issues),
    )


# Re-exported for tests / programmatic use
__all__ = [
    "FlowEdge",
    "FlowNode",
    "FlowValidator",
    "app",
    "parse_pep8",
]
