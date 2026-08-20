#!/usr/bin/env bash
# Boots the API and the frontend together. Ctrl-C stops both.
set -e
cd "$(dirname "$0")"

if [ ! -d backend/.venv ]; then
  echo "→ Creating the Python virtual environment..."
  python3 -m venv backend/.venv
  backend/.venv/bin/pip install -q -r backend/requirements.txt
fi

if [ ! -d frontend/node_modules ]; then
  echo "→ Installing frontend packages..."
  (cd frontend && npm install)
fi

[ -f backend/.env ] || cp backend/.env.example backend/.env
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

cleanup() { echo; echo "Stopping..."; kill 0; }
trap cleanup EXIT INT TERM

echo "→ API      http://localhost:8000/docs"
(cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000) &

sleep 2
echo "→ Frontend http://localhost:5173"
(cd frontend && npm run dev) &

wait
