FROM node:20-slim

# Install Python and necessary build tools
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv build-essential && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the frontend folder (which contains both Next.js and FastAPI code)
COPY frontend ./frontend

# Create a virtual environment for Python and install dependencies
RUN python3 -m venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

WORKDIR /app/frontend
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies and build the Next.js app
RUN npm install
RUN npm run build

# Expose ports (8000 for FastAPI, 3000 for Next.js)
EXPOSE 8000
EXPOSE 3000

# Start the application using the start script
ENV PORT=3000
CMD ["bash", "start.sh"]
