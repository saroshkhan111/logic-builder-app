"""PEP 8 style parser.

Lightweight, dependency-free PEP 8 checks over Python source text, suitable
for running in constrained environments (and mirroring what flake8 enforces
on our own engine code). Returns structured issues the frontend can render.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

MAX_LINE_LENGTH = 88  # matches black's config in pyproject.toml

_TRAILING_WS = re.compile(r"[ \t]+$")
_TABS = re.compile(r"^\t+")
_TODO = re.compile(r"#\s*TODO", re.IGNORECASE)


@dataclass(frozen=True)
class PEP8Issue:
    """A single style violation found in Python source."""

    line: int
    column: int
    code: str  # e.g. "E501", "W291"
    message: str

    def as_dict(self) -> dict[str, object]:
        return {
            "line": self.line,
            "column": self.column,
            "code": self.code,
            "message": self.message,
        }


def parse_pep8(source: str, max_line_length: int = MAX_LINE_LENGTH) -> list[PEP8Issue]:
    """Parse Python source text and return PEP 8 violations.

    Checks implemented:
      E501 — line too long
      W291 — trailing whitespace
      W191 — tabs used for indentation
      E111 — indentation is not a multiple of four
      E303 — too many blank lines (> 2)
    """
    issues: list[PEP8Issue] = []
    blank_run = 0

    for lineno, line in enumerate(source.splitlines(), start=1):
        stripped = line.rstrip("\n")

        # Track blank-line runs
        if not stripped.strip():
            blank_run += 1
            if blank_run > 3:
                issues.append(
                    PEP8Issue(lineno, 1, "E303", "too many blank lines (> 2)")
                )
        else:
            blank_run = 0

        # E501 — line too long
        if len(stripped) > max_line_length:
            issues.append(
                PEP8Issue(
                    lineno,
                    max_line_length + 1,
                    "E501",
                    f"line too long ({len(stripped)} > {max_line_length})",
                )
            )

        # W291 — trailing whitespace (ignore inside blank lines)
        if _TRAILING_WS.search(stripped):
            issues.append(
                PEP8Issue(lineno, len(stripped), "W291", "trailing whitespace")
            )

        # W191 — tab indentation
        if _TABS.match(stripped):
            issues.append(PEP8Issue(lineno, 1, "W191", "indentation contains tabs"))
            continue

        # E111 — indentation not multiple of 4
        indent = len(stripped) - len(stripped.lstrip(" "))
        if indent % 4 != 0:
            issues.append(
                PEP8Issue(
                    lineno,
                    indent + 1,
                    "E111",
                    "indentation is not a multiple of four",
                )
            )

    issues.sort(key=lambda i: (i.line, i.column))
    return issues
