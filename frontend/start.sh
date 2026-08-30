#!/bin/bash
cd ../scripts
uvicorn server:app --host 0.0.0.0 --port 8000 &
cd ../frontend
npx next start -p $PORT
