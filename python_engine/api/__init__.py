"""FastAPI application exposing the python_engine over HTTP."""

from python_engine.api.main import app

__all__ = ["app"]
