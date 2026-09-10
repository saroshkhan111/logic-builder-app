"""Tests for the PEP 8 parser."""

from python_engine.core.pep8_parser import parse_pep8


def test_clean_source_has_no_issues():
    source = "def add(a, b):\n    return a + b\n"
    assert parse_pep8(source) == []


def test_line_too_long():
    source = "x = " + "1" * 100 + "\n"
    issues = parse_pep8(source)
    assert any(i.code == "E501" for i in issues)


def test_trailing_whitespace():
    issues = parse_pep8("x = 1   \n")
    assert any(i.code == "W291" for i in issues)


def test_tab_indentation():
    issues = parse_pep8("def f():\n\treturn 1\n")
    assert any(i.code == "W191" for i in issues)


def test_bad_indent_multiple():
    issues = parse_pep8("def f():\n   return 1\n")
    assert any(i.code == "E111" for i in issues)


def test_issues_sorted_by_line():
    source = "x = 1   \ny = " + "2" * 100 + "\n"
    issues = parse_pep8(source)
    lines = [i.line for i in issues]
    assert lines == sorted(lines)
