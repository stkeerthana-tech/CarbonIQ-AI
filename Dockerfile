# =============================================================================
# Carboniq AI - Backend Production Dockerfile
# =============================================================================
FROM python:3.11-slim AS production

# Set environment variables for Python runtime & Carboniq configuration
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app/backend \
    PORT=5000 \
    FLASK_ENV=production

# Install curl for healthcheck & security updates
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user and group
RUN groupadd -r carboniq && useradd -r -g carboniq -u 1000 -d /app -s /sbin/nologin carboniq

# Set root application directory
WORKDIR /app

# Copy dependency definition and install Python packages
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend application source and emission factors knowledge base
COPY backend/ /app/backend/
COPY data/ /app/data/

# Ensure SQLite instance directory exists and assign non-root permissions
RUN mkdir -p /app/backend/instance /app/data && \
    chown -R carboniq:carboniq /app

# Switch to non-root user
USER carboniq

# Expose backend service port
EXPOSE 5000

# Docker Healthcheck targeting native /api/health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Launch production WSGI application with Gunicorn
WORKDIR /app/backend
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--threads", "4", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "app:create_app()"]
