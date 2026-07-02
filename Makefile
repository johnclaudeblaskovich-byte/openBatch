.PHONY: frontend backend test test-frontend test-backend install

# Start the Vite dev server (http://localhost:5173)
frontend:
	cd frontend && npm run dev

# Start the Uvicorn dev server (http://localhost:8000)
backend:
	cd openbatch-backend && uvicorn app.main:app --reload --port 8000

# Run both test suites
test: test-frontend test-backend

test-frontend:
	cd frontend && npm run test

test-backend:
	cd openbatch-backend && pytest

# Install all dependencies
install:
	cd frontend && npm install
	cd openbatch-backend && pip install -r requirements.txt
