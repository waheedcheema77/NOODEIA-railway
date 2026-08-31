#!/bin/bash
cd scripts
python -m uvicorn server:app --host 0.0.0.0 --port 8000 &
cd ..
npx next start -p $PORT
