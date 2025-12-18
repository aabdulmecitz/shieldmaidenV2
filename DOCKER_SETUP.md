# ShieldMaiden - Docker Compose Setup Guide

## Overview

This project uses Docker Compose to orchestrate all services for the IoT Flight Tracking System. Services are organized into 6 main components that can be developed and tested independently.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Flight Tracker System                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   Backend    │  │  WebSocket   │      │
│  │  (React +    │◄─┤  (Express +  │◄─┤  (Socket.io) │      │
│  │   Leaflet)   │  │   REST API)  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │    Redis     │  │  Prometheus  │      │
│  │  (Database)  │  │   (Queue)    │  │  + Grafana   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Services

### Service 1: Core Infrastructure
- **MongoDB** (port 27017): Primary database
- **Redis** (port 6379): Queue and cache

### Service 2: Telemetry Service
- **Backend API** (port 5000): Flight data ingestion and processing

### Service 3: Alert Service
- Integrated into Backend API
- Monitors thresholds and geofences

### Service 4: WebSocket Service
- Integrated into Backend API
- Real-time data streaming

### Service 5: Frontend Service
- **React App** (port 3000): User interface with maps and charts

### Service 6: Monitoring Service
- **Prometheus** (port 9090): Metrics collection
- **Grafana** (port 3001): Dashboards and visualization

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM available
- 10GB+ disk space

### 1. Clone and Setup

```bash
# Navigate to project directory
cd futuredesigners

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Start All Services

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Verify Services

```bash
# Check MongoDB
docker exec -it flight-tracker-mongodb mongosh --eval "db.adminCommand('ping')"

# Check Redis
docker exec -it flight-tracker-redis redis-cli ping

# Check Backend API
curl http://localhost:5000/health

# Check Frontend
curl http://localhost:3000
```

### 4. Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

## Service-by-Service Development

### Start Only Infrastructure

```bash
# Start MongoDB and Redis only
docker-compose up -d mongodb redis

# Verify
docker-compose ps mongodb redis
```

### Start Backend Service

```bash
# Start backend with dependencies
docker-compose up -d mongodb redis backend

# View backend logs
docker-compose logs -f backend
```

### Start Frontend Service

```bash
# Start frontend with dependencies
docker-compose up -d mongodb redis backend frontend

# View frontend logs
docker-compose logs -f frontend
```

### Start Monitoring

```bash
# Start monitoring stack
docker-compose up -d prometheus grafana

# Access Grafana
open http://localhost:3001
```

## Development Workflow

### Hot Reload

Both frontend and backend support hot reload:

```bash
# Backend changes are automatically detected
# Frontend changes trigger Vite HMR

# Restart a specific service
docker-compose restart backend
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# MongoDB shell
docker-compose exec mongodb mongosh flight_tracker

# Redis CLI
docker-compose exec redis redis-cli
```

## Data Management

### Backup Data

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out=/data/backup

# Backup Redis
docker-compose exec redis redis-cli SAVE
```

### Reset Data

```bash
# Stop services
docker-compose down

# Remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart fresh
docker-compose up -d
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker-compose logs backend

# Check health status
docker-compose ps

# Restart service
docker-compose restart backend
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000

# Kill process or change port in docker-compose.yml
```

### Out of Memory

```bash
# Check Docker resources
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Network Issues

```bash
# Recreate network
docker-compose down
docker network prune
docker-compose up -d
```

## Production Deployment

### Build Production Images

```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

```bash
# Use production .env file
cp .env.production .env

# Set secure secrets
export JWT_SECRET=$(openssl rand -base64 32)
```

## Health Checks

All services include health checks:

```bash
# View health status
docker-compose ps

# Manually check health
docker inspect --format='{{json .State.Health}}' flight-tracker-backend
```

## Scaling

```bash
# Scale backend service
docker-compose up -d --scale backend=3

# Note: Requires load balancer configuration
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Complete cleanup
docker system prune -a --volumes
```

## Next Steps

1. ✅ Start infrastructure: `docker-compose up -d mongodb redis`
2. ✅ Verify connections
3. 🔄 Implement Service 2 (Telemetry API)
4. 🔄 Implement Service 3 (Alert Engine)
5. 🔄 Implement Service 4 (WebSocket)
6. 🔄 Build Service 5 (Frontend)
7. 🔄 Configure Service 6 (Monitoring)

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review health: `docker-compose ps`
- Consult documentation in `/docs`
