# Docker Compose for Local Testing

This directory contains a `docker-compose.yml` file for running the Profile Agent locally without Kubernetes, matching the same deployment configuration as the k8s setup.

## Quick Start

### 1. Build the Docker image
```bash
cd /home/bharath/workspace/profile_agent
export REGISTRY=docker.io/krishbharath
bash scripts/build-docker.sh
```

### 2. Create .env file (optional, for Gemini API)
```bash
cp k8s/.env.example k8s/.env
# Edit k8s/.env and add your GOOGLE_API_KEY if using Gemini
```

### 3. Start the services
```bash
cd k8s
docker-compose up
```

The services will be available at:
- **Next.js Frontend**: http://localhost:3000
- **FastAPI Agent Backend**: http://localhost:8001

### 4. Stop the services
```bash
docker-compose down
```

## Configuration

### Model Selection

The `docker-compose.yml` is pre-configured to use **Ollama** (recommended for local testing). To switch models:

#### Option A: Use Ollama (Default - No setup required)
```yaml
environment:
  USE_LITELLM: "true"
  MODEL_NAME: "openai/qwen3-coder-next:q4_K_M"
  OPENAI_API_BASE: "https://ollama.krishb.in/v1"
  OPENAI_API_KEY: "dummy"
```

#### Option B: Use Google Gemini (Requires API key)
1. Create `k8s/.env` with your API key:
```bash
GOOGLE_API_KEY=your-actual-key
```

2. Uncomment Gemini configuration in `docker-compose.yml`:
```yaml
# For testing with Google Gemini (requires GOOGLE_API_KEY):
USE_LITELLM: "false"
MODEL_NAME: "gemini-2.5-flash"
GOOGLE_API_KEY: "${GOOGLE_API_KEY}"
```

3. Comment out the Ollama configuration.

## Volumes

- **conversation-notes**: Stores conversation notes between sessions
  - Maps to: `/conversation_notes` in container
  - Local path: Docker-managed volume (auto-created)
  - To persist notes after container stops: Use named volume (already configured)

## Resource Limits

The compose file includes the same resource constraints as the k8s deployment:
- Memory: 512Mi requests, 2Gi limit
- CPU: 500m requests, 2000m limit

## Comparison with Kubernetes

| Aspect | Docker Compose | Kubernetes |
|--------|---|---|
| Startup | `docker-compose up` (seconds) | `kubectl apply -k ...` (seconds) |
| Environment | `docker-compose.yml` + `.env` | ConfigMap + Secrets |
| Volumes | Named volumes or bind mounts | hostPath or PVC |
| Image | Local or registry | Registry (auto-pull) |
| Networking | Bridge network | Service DNS |
| Scaling | Not supported | `replicas: N` |
| Port exposure | Explicitly mapped | Service LoadBalancer/ClusterIP |

## Troubleshooting

### Port already in use
```bash
# Find process using port 3000 or 8001
lsof -i :3000
lsof -i :8001

# Kill the process
kill -9 <PID>

# Or use a different port
docker-compose up -p 3001:3000 -p 8002:8001
```

### Image not found
Make sure you built the image first:
```bash
bash scripts/build-docker.sh
```

### Connection refused to agent backend
- Check agent is running: `docker-compose logs`
- Verify port 8001 is exposed: `docker-compose ps`
- Wait 5-10 seconds for agent to fully start

### Conversation notes not persisting
Check volume mount:
```bash
docker volume ls | grep conversation
docker volume inspect profile-agent-compose_conversation-notes
```

## Development Tips

### View logs
```bash
# All services
docker-compose logs -f

# Just the agent
docker-compose logs -f profile-agent

# Last 100 lines
docker-compose logs --tail=100
```

### Execute commands in container
```bash
docker-compose exec profile-agent bash
```

### Rebuild after code changes
```bash
# Rebuild image with latest code
bash scripts/build-docker.sh

# Restart services
docker-compose down && docker-compose up
```

### Use local image (skip registry)
If `REGISTRY` env var not set during build, image is tagged as `profile-agent:latest`:
```bash
# In docker-compose.yml, change:
image: krishbharath/profile-agent:latest
# To:
image: profile-agent:latest
```

## Key Differences from pnpm dev

The `docker-compose` approach:
- ✅ Matches production deployment exactly
- ✅ Single unified image (no separate build steps)
- ✅ Environment variables via compose file + .env
- ✅ Volume mounts like k8s
- ❌ Slower development iteration (rebuild required)

The `pnpm dev` approach:
- ✅ Hot reload for frontend and backend
- ✅ Faster development
- ❌ Not representative of production
- ❌ Separate processes to manage

**Recommendation**: Use `pnpm dev` for development, `docker-compose` for pre-deployment testing.
