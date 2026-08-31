#!/bin/bash
cd scripts
if [ -d "/app/.venv" ]; then
  source /app/.venv/bin/activate
fi
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &
cd ..
npx next start -p $PORT
