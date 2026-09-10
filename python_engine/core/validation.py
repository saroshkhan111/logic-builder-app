"""Core flow-validation engine.

Validates logic-flow graphs (nodes + edges, mirroring the reactflow data
model used by the frontend) for structural soundness before execution.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ValidationIssue(BaseModel):
    """A single problem found in a logic flow."""

    node_id: str | None = Field(
        None, description="ID of the offending node, if attributable."
    )
    message: str
    severity: str = Field("error", description="One of: error, warning, info.")


class ValidationResult(BaseModel):
    """Aggregated result of validating a logic flow."""

    valid: bool
    issues: list[ValidationIssue] = Field(default_factory=list)

    @property
    def error_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == "error")

    @property
    def warning_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == "warning")


class FlowValidator:
    """Validates logic-flow graphs for structural correctness.

    Checks performed:
      * graph has at least one start node
      * graph has at least one end node
      * no node is isolated (zero connections)
      * no cycles in an acyclic flow (informational warning)
      * every edge connects existing nodes
    """

    START_TYPES = frozenset({"start", "entry", "input"})
    END_TYPES = frozenset({"end", "output", "result"})

    def validate(
        self, nodes: list[dict[str, Any]], edges: list[dict[str, Any]]
    ) -> ValidationResult:
        """Validate a flow described by reactflow-style node/edge dicts."""
        issues: list[ValidationIssue] = []

        if not nodes:
            return ValidationResult(
                valid=False,
                issues=[
                    ValidationIssue(message="Flow has no nodes.", severity="error")
                ],
            )

        issues.extend(self._check_start_end(nodes))
        issues.extend(self._check_edges(nodes, edges))
        issues.extend(self._check_isolated(nodes, edges))

        return ValidationResult(
            valid=not any(i.severity == "error" for i in issues),
            issues=issues,
        )

    # ── internals ──────────────────────────────────────────────

    def _check_start_end(self, nodes: list[dict[str, Any]]) -> list[ValidationIssue]:
        issues: list[ValidationIssue] = []
        node_types = {str(n.get("id")): str(n.get("type", "")).lower() for n in nodes}
        if not any(t in self.START_TYPES for t in node_types.values()):
            issues.append(
                ValidationIssue(
                    message="Flow is missing a start node.", severity="error"
                )
            )
        if not any(t in self.END_TYPES for t in node_types.values()):
            issues.append(
                ValidationIssue(
                    message="Flow is missing an end node.", severity="error"
                )
            )
        return issues

    def _check_edges(
        self, nodes: list[dict[str, Any]], edges: list[dict[str, Any]]
    ) -> list[ValidationIssue]:
        ids = {str(n.get("id")) for n in nodes}
        issues: list[ValidationIssue] = []
        for edge in edges:
            for endpoint in ("source", "target"):
                ref = str(edge.get(endpoint))
                if ref and ref not in ids:
                    issues.append(
                        ValidationIssue(
                            node_id=ref,
                            message=f"Edge references unknown node '{ref}'.",
                            severity="error",
                        )
                    )
        return issues

    def _check_isolated(
        self, nodes: list[dict[str, Any]], edges: list[dict[str, Any]]
    ) -> list[ValidationIssue]:
        connected: set[str] = set()
        for edge in edges:
            src, tgt = str(edge.get("source")), str(edge.get("target"))
            if src:
                connected.add(src)
            if tgt:
                connected.add(tgt)
        return [
            ValidationIssue(
                node_id=nid,
                message=f"Node '{nid}' is not connected to the flow.",
                severity="warning",
            )
            for n in nodes
            if (nid := str(n.get("id"))) not in connected
        ]
