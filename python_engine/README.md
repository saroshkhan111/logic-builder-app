# Python Engine

`uv`-managed Python tooling for logic-builder-app.

## Layout

- `core/` — validation engine (`FlowValidator`) and PEP 8 parser; pure logic
- `api/` — FastAPI app (`/health`, `/validate/flow`, `/parse/pep8`)
- `scripts/` — `run_checks.py` quality gate
- `tests/` — pytest suite

## Common commands

```bash
uv sync                                  # install deps into .venv
uv run pytest                            # run tests
uv run black python_engine               # format
uv run flake8 python_engine              # lint
uv run python -m python_engine.scripts.run_checks   # full gate
uv run uvicorn python_engine.api.main:app --reload  # serve API
```
