#!/bin/bash
# Mandala Chart App - Start Script

echo "Starting Mandala Chart App..."

# Check GROQ_API_KEY
if grep -q "your_groq_api_key_here" backend/.env; then
  echo "[WARNING] GROQ_API_KEY not set in backend/.env"
  echo "  AI features will not work until you set your key."
  echo "  Get your key from: https://console.groq.com"
fi

# Start backend
echo "[1/2] Starting backend on http://localhost:3001..."
cd backend && npm start &
BACKEND_PID=$!
cd ..

# Wait for backend
sleep 2

# Start frontend
echo "[2/2] Starting frontend on http://localhost:5173..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "App started!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait and handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" SIGINT SIGTERM
wait
