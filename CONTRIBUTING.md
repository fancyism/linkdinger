# Contributing to Linkdinger

Thank you for your interest in contributing to Linkdinger! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

1. **Clear title** describing the problem
2. **Steps to reproduce** the issue
3. **Expected behavior** vs actual behavior
4. **Environment details** (OS, Python version, Node version)
5. **Logs or screenshots** if applicable

### Suggesting Features

Feature suggestions are welcome! Please:

1. Check if the feature has already been suggested
2. Create an issue with `[Feature]` prefix
3. Describe the feature and its use case
4. Explain why it would benefit most users

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our code style
4. **Test your changes**:
   ```bash
   python -m pytest tests/ -v
   cd blog && npm run build
   ```
5. **Commit with clear messages**:
   ```bash
   git commit -m "Add: feature description"
   ```
6. **Push and create PR**

## Development Setup

### Backend (Python)

```bash
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python linkdinger.py --status
```

### Frontend (Blog)

```bash
cd blog
npm install
npm run dev
```

## Code Style

### Python

- Use Python 3.10+ type hints
- Functions under 50 lines
- Docstrings for public functions
- Follow PEP 8 conventions
- Use logging over print statements

### TypeScript/React

- Server Components by default
- Define all interactive states (hover, focus, active, disabled)
- Mobile-first responsive design
- Semantic HTML5 elements

## Project Structure

```
linkdinger/
├── linkdinger.py          # Main daemon entry
├── obsidian_watcher.py    # Image processing
├── auto_git.py            # Git synchronization
├── content_sync.py        # CMS sync
├── tests/                 # Test files
└── blog/                  # Next.js frontend
```

## Testing

### Python Tests

```bash
python -m pytest tests/ -v
```

### Blog Tests

```bash
cd blog
npm run build    # Build check
npm run lint     # Lint check
```

## Security

- **Never commit `.env` files**
- **Never commit API keys or credentials**
- Report security issues privately

## License

By contributing, you agree that your contributions will be licensed under:
- MIT License for code
- CC BY 4.0 for documentation

---

Thank you for helping make Linkdinger better!
