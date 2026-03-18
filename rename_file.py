import sys
import io
import os
from typing import cast

def _fix_terminal_encoding() -> None:
    """
    Fix Unicode encoding for Windows terminal (cp1252 → UTF-8)
    Uses proper type casting to io.TextIOWrapper to avoid Pyre error:
    'Object of class TextIO has no attribute reconfigure'
    """
    if sys.stdout.encoding != 'utf-8':
        cast(io.TextIOWrapper, sys.stdout).reconfigure(encoding='utf-8')
    if sys.stderr.encoding != 'utf-8':
        cast(io.TextIOWrapper, sys.stderr).reconfigure(encoding='utf-8')

_fix_terminal_encoding()

def rename_obsidian_file(old_path: str, new_path: str):
    """
    Template for renaming an Obsidian file programmatically.
    Use this script to execute safe renames across the vault.
    """
    pass

if __name__ == "__main__":
    print("Rename script ready. Pyre errors resolved!")
