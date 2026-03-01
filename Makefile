.PHONY: install install-backend install-frontend dev dev-backend dev-frontend help

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo "Route Ranker MVP — available commands:"
	@echo ""
	@echo "  make install          Install all dependencies (backend + frontend)"
	@echo "  make install-backend  Install Python dependencies only"
	@echo "  make install-frontend Install Node dependencies only"
	@echo ""
	@echo "  make dev              Start both servers in parallel"
	@echo "  make dev-backend      Start FastAPI server  (http://localhost:8000)"
	@echo "  make dev-frontend     Start Next.js server  (http://localhost:3000)"
	@echo ""
	@echo "  make setup            Copy .env.example files (run once after clone)"

# ── Setup (first-time) ────────────────────────────────────────────────────────
setup:
	@if [ ! -f backend/.env ]; then \
		cp backend/.env.example backend/.env; \
		echo "Created backend/.env — fill in your API keys"; \
	else \
		echo "backend/.env already exists, skipping"; \
	fi
	@if [ ! -f frontend/.env.local ]; then \
		cp frontend/.env.local.example frontend/.env.local; \
		echo "Created frontend/.env.local — fill in your API keys"; \
	else \
		echo "frontend/.env.local already exists, skipping"; \
	fi

# ── Install ───────────────────────────────────────────────────────────────────
install: install-backend install-frontend

install-backend:
	@echo "Installing Python dependencies..."
	cd backend && pip install -r requirements.txt

install-frontend:
	@echo "Installing Node dependencies..."
	cd frontend && npm install

# ── Dev servers ───────────────────────────────────────────────────────────────
dev:
	@echo "Starting backend (port 8000) and frontend (port 3000)..."
	@trap 'kill %1 %2 2>/dev/null; exit 0' INT; \
	$(MAKE) dev-backend & \
	$(MAKE) dev-frontend & \
	wait

dev-backend:
	cd backend && uvicorn main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev
