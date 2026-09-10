"""Tests for the flow validation engine."""

from python_engine.core.validation import FlowValidator

validator = FlowValidator()


def make_flow():
    return (
        [
            {"id": "n1", "type": "start", "data": {}},
            {"id": "n2", "type": "process", "data": {}},
            {"id": "n3", "type": "end", "data": {}},
        ],
        [
            {"source": "n1", "target": "n2"},
            {"source": "n2", "target": "n3"},
        ],
    )


def test_valid_flow_passes():
    nodes, edges = make_flow()
    result = validator.validate(nodes, edges)
    assert result.valid
    assert result.issues == []


def test_empty_flow_is_invalid():
    result = validator.validate([], [])
    assert not result.valid
    assert result.issues[0].message == "Flow has no nodes."


def test_missing_start_node():
    nodes, edges = make_flow()
    nodes = [n for n in nodes if n["type"] != "start"]
    result = validator.validate(nodes, edges)
    assert not result.valid
    assert any("missing a start node" in i.message for i in result.issues)


def test_dangling_edge_is_error():
    nodes, edges = make_flow()
    edges.append({"source": "n3", "target": "ghost"})
    result = validator.validate(nodes, edges)
    assert not result.valid
    assert any(i.node_id == "ghost" for i in result.issues)


def test_isolated_node_is_warning():
    nodes, edges = make_flow()
    nodes.append({"id": "lonely", "type": "process", "data": {}})
    result = validator.validate(nodes, edges)
    assert result.valid  # warnings don't invalidate
    assert any(i.severity == "warning" and i.node_id == "lonely" for i in result.issues)
