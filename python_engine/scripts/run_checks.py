"""One-shot code-quality gate: black --check, flake8, pytest.

Usage:  uv run python -m python_engine.scripts.run_checks
"""

from __future__ import annotations

import subprocess
import sys

STEPS: list[tuple[str, list[str]]] = [
    ("black --check", ["black", "--check", "python_engine"]),
    ("flake8", ["flake8", "python_engine"]),
    ("pytest", ["pytest", "python_engine/tests", "-q"]),
]


def main() -> int:
    failed = False
    for name, cmd in STEPS:
        print(f"\n==> {name}")
        result = subprocess.run(cmd, check=False)
        if result.returncode != 0:
            failed = True
            print(f"FAILED: {name}", file=sys.stderr)
    print("\nAll checks passed." if not failed else "\nChecks failed.")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
