"""Python tooling & execution engine for logic-builder-app.

Layout:
    core/     — validation engine, PEP 8 parser, pure logic (no I/O)
    api/      — FastAPI application exposing the engine over HTTP
    scripts/  — operational entry points (checks, formatting)
    tests/    — pytest suite
"""

__version__ = "0.1.0"
