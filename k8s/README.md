# Kubernetes Deployment for Profile Agent

This directory contains Kubernetes manifests for deploying the Profile Agent application (Next.js + FastAPI agent) to a Kubernetes cluster.

## Prerequisites

1. **Kubernetes cluster** - Running and accessible via `kubectl`
2. **kubectl** - Configured to connect to your cluster
3. **kustomize** - Built into `kubectl` (v1.14+) or install separately
4. **NGINX Ingress Controller** - Installed in your cluster
5. **cert-manager** - For automatic TLS certificate management (optional but recommended)
6. **Docker** - To build the application image

## Quick Start

### 1. Build the Docker Image

```bash
# From the project root
docker build -t profile-agent:latest .

# If using a remote registry, tag and push
docker tag profile-agent:latest <your-registry>/profile-agent:latest
docker push <your-registry>/profile-agent:latest
```

### 2. Create Secrets

Copy the secret template and add your actual secrets:

```bash
# Copy template
cp k8s/base/secret-template.yaml k8s/base/secret.yaml

# Encode your Google API key
echo -n 'your-google-api-key' | base64

# Edit secret.yaml and replace PASTE_YOUR_BASE64_ENCODED_KEY_HERE with the encoded value
# Then apply it
kubectl apply -f k8s/base/secret.yaml
```

**Important:** Add `k8s/base/secret.yaml` to `.gitignore` to avoid committing secrets!

### 3. Deploy to Kubernetes

```bash
# Deploy using kustomize (from project root)
kubectl apply -k k8s/overlays/local

# Or using base directly
kubectl apply -k k8s/base
```

### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -l app=profile-agent

# Check services
kubectl get svc profile-agent-service

# Check ingress
kubectl get ingress profile-agent-ingress

# View logs
kubectl logs -l app=profile-agent -f

# Check both container ports
kubectl logs -l app=profile-agent -c profile-agent
```

### 5. Access the Application

Once deployed, the application will be available at:
- **HTTPS**: https://profile.krishb.in

Make sure your DNS is configured to point `profile.krishb.in` to your ingress controller's external IP.

## Configuration

### Environment Variables

Edit `k8s/base/config-map.yaml` to modify:
- `NODE_ENV` - Node.js environment (production/development)
- `PORT` - Next.js port (default: 3000)
- `PYTHON_PORT` - FastAPI agent port (default: 8001)
- `MODEL_NAME` - Gemini model name
- `LOG_LEVEL` - Logging level (info/debug/error)

### Secrets

Edit your `k8s/base/secret.yaml` to set:
- `GOOGLE_API_KEY` - **Required** for Gemini model
- `LANGFUSE_PUBLIC_KEY` - Optional for observability
- `LANGFUSE_SECRET_KEY` - Optional for observability

### Resource Limits

Edit `k8s/base/app-deployment.yaml` to adjust:
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"
```

## TLS/HTTPS Setup

The ingress is configured to use cert-manager for automatic TLS certificates:

1. **Install cert-manager** (if not already installed):
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.0/cert-manager.yaml
```

2. **Create a ClusterIssuer** for Let's Encrypt:
```bash
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: bharath.chakravarthi@gmail.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

3. The certificate will be automatically created and stored in the `profile-agent-tls` secret.

### Using a Different Domain

To use a different domain, edit `k8s/base/ingress.yaml`:
```yaml
spec:
  tls:
  - hosts:
    - your-domain.com  # Change this
    secretName: profile-agent-tls
  rules:
  - host: your-domain.com  # Change this
```

## Troubleshooting

### Pod not starting
```bash
# Check pod events
kubectl describe pod -l app=profile-agent

# Check logs
kubectl logs -l app=profile-agent --all-containers=true
```

### Agent not connecting
```bash
# Check if both ports are exposed
kubectl get svc profile-agent-service

# Port-forward to test locally
kubectl port-forward svc/profile-agent-service 3000:80 8001:8001
```

### Ingress not working
```bash
# Check ingress status
kubectl describe ingress profile-agent-ingress

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller
```

### Certificate issues
```bash
# Check certificate status
kubectl get certificate

# Check cert-manager logs
kubectl logs -n cert-manager -l app=cert-manager
```

## Updating the Deployment

```bash
# Rebuild image
docker build -t profile-agent:latest .

# If using local image in k8s, load it to your cluster
# For minikube:
minikube image load profile-agent:latest

# For kind:
kind load docker-image profile-agent:latest

# Restart pods to pick up new image
kubectl rollout restart deployment/profile-agent

# Watch rollout status
kubectl rollout status deployment/profile-agent
```

## Cleanup

```bash
# Delete all resources
kubectl delete -k k8s/overlays/local

# Or delete base
kubectl delete -k k8s/base

# Don't forget to delete your secret if it was applied separately
kubectl delete secret profile-agent-secrets
```

## Architecture

The deployment runs both services in a single container:
- **Next.js** (port 3000) - Frontend UI
- **FastAPI** (port 8001) - AI Agent backend

Both services start via the `docker-entrypoint.sh` script:
1. FastAPI agent starts in the background
2. Next.js starts in the foreground
3. Health checks ensure both are running

## Production Considerations

For production deployments:

1. **Use a container registry**: Push images to Docker Hub, GCR, ECR, etc.
2. **Update imagePullPolicy**: Change to `Always` in deployment
3. **Add horizontal scaling**: Increase replicas in deployment
4. **Configure monitoring**: Add Prometheus/Grafana for metrics
5. **Set up logging**: Use EFK or Loki stack for centralized logs
6. **Use resource quotas**: Limit namespace resource usage
7. **Add network policies**: Restrict pod-to-pod communication
8. **Use separate namespaces**: For dev/staging/prod environments
