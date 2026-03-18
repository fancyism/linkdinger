# Type Stubs Directory

This directory contains custom type stubs (`.pyi` files) for third-party packages
that don't provide their own type hints.

## Usage

If you need to add type stubs for a library without type hints:

1. Create a `.pyi` file matching the package name (e.g., `some_package.pyi`)
2. Add minimal type declarations for the functions/classes you use
3. The type checkers (Pyright, Pyre, MyPy) will automatically pick them up

## Installed Type Stubs

The following type stub packages are installed via `pip install -e ".[dev]"`:

- `types-PyYAML` - Type hints for PyYAML
- `types-requests` - Type hints for requests
- `boto3-stubs` - Type hints for boto3

## Libraries Without Type Stubs

The following libraries don't have type stubs available and use `# type: ignore[import]`:

- `flask` - No official type stubs (consider `flask-stubs` community package)
- `Pillow` - No official type stubs
- `watchdog` - No official type stubs
- `python-dotenv` - No official type stubs
