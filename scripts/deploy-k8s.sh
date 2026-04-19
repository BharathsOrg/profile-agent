#!/bin/bash
# Deployment script for Profile Agent to Kubernetes

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Default overlay
OVERLAY="${1:-local}"
NAMESPACE="profile-agent"

echo -e "${BLUE}Deploying Profile Agent to Kubernetes (overlay: $OVERLAY, namespace: $NAMESPACE)...${NC}"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}Error: kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if cluster is accessible
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

# Create namespace if it doesn't exist
echo -e "${BLUE}Creating namespace '$NAMESPACE' if it doesn't exist...${NC}"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"

# Check if secret exists
if [ ! -f "k8s/base/secret.yaml" ]; then
    echo -e "${YELLOW}Warning: k8s/base/secret.yaml not found!${NC}"
    echo "Please create it from the template:"
    # echo "  cp k8s/base/secret-template.yaml k8s/base/secret.yaml"
    # echo "  # Edit secret.yaml and add your base64-encoded secrets"
    echo ""
    read -p "Continue without applying secrets? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${BLUE}Applying secrets to namespace '$NAMESPACE'...${NC}"
    kubectl apply -f k8s/base/secret.yaml -n "$NAMESPACE"
    echo -e "${GREEN}✓ Secrets applied${NC}"
fi

# Apply kustomization
echo -e "${BLUE}Applying kustomization from k8s/overlays/$OVERLAY to namespace '$NAMESPACE'...${NC}"
kubectl apply -k "k8s/overlays/$OVERLAY" -n "$NAMESPACE"

echo -e "${GREEN}✓ Deployment applied${NC}"

# Wait for deployment to be ready
echo -e "${BLUE}Waiting for deployment to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/profile-agent -n "$NAMESPACE"

echo -e "${GREEN}✓ Deployment is ready!${NC}"

# Show status
echo ""
echo -e "${BLUE}Deployment status (namespace: $NAMESPACE):${NC}"
kubectl get pods -l app=profile-agent -n "$NAMESPACE"
echo ""
kubectl get svc profile-agent-service -n "$NAMESPACE"
echo ""
kubectl get ingress profile-agent-ingress -n "$NAMESPACE"

# Get ingress URL
echo ""
echo -e "${GREEN}Application deployed successfully!${NC}"
echo -e "Access at: ${BLUE}https://profile.krishb.in${NC}"
echo -e "Namespace: ${BLUE}$NAMESPACE${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    kubectl logs -l app=profile-agent -f -n $NAMESPACE"
echo "  Get pods:     kubectl get pods -l app=profile-agent -n $NAMESPACE"
echo "  Describe pod: kubectl describe pod -l app=profile-agent -n $NAMESPACE"
echo "  Port forward: kubectl port-forward svc/profile-agent-service 3000:80 8001:8001 -n $NAMESPACE"
echo "  Delete:       kubectl delete -k k8s/overlays/$OVERLAY -n $NAMESPACE"
