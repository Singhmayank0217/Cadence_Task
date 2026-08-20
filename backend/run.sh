#!/usr/bin/env bash
# Convenience wrapper: uvicorn app.main:app --reload --port 8000
cd "$(dirname "$0")"
exec uvicorn app.main:app --reload --port "${PORT:-8000}"
