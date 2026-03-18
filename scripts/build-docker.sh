#!/bin/bash
# Build script for Profile Agent Docker image

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Profile Agent Docker image...${NC}"

# Get the script directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Default image name and registry
IMAGE_NAME="${IMAGE_NAME:-profile-agent}"
REGISTRY="${REGISTRY:-}"

# Get short commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

# Build image with local tags first
echo -e "${BLUE}Building image: $IMAGE_NAME:latest and $IMAGE_NAME:$COMMIT_HASH${NC}"

docker build \
    --tag "$IMAGE_NAME:latest" \
    --tag "$IMAGE_NAME:$COMMIT_HASH" \
    --file Dockerfile \
    .

echo -e "${GREEN}✓ Successfully built:${NC}"
echo -e "  - $IMAGE_NAME:latest"
echo -e "  - $IMAGE_NAME:$COMMIT_HASH"

# If registry is specified, tag and push
if [ -n "$REGISTRY" ]; then
    REGISTRY_IMAGE_LATEST="$REGISTRY/$IMAGE_NAME:latest"
    REGISTRY_IMAGE_COMMIT="$REGISTRY/$IMAGE_NAME:$COMMIT_HASH"

    echo ""
    echo -e "${BLUE}Registry detected: $REGISTRY${NC}"
    echo "Ready to tag and push:"
    echo "  - $REGISTRY_IMAGE_LATEST"
    echo "  - $REGISTRY_IMAGE_COMMIT"
    echo ""
    read -p "Push to registry? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Tagging images...${NC}"
        docker tag "$IMAGE_NAME:latest" "$REGISTRY_IMAGE_LATEST"
        docker tag "$IMAGE_NAME:$COMMIT_HASH" "$REGISTRY_IMAGE_COMMIT"

        echo -e "${BLUE}Pushing images to registry...${NC}"
        docker push "$REGISTRY_IMAGE_LATEST"
        docker push "$REGISTRY_IMAGE_COMMIT"
        echo -e "${GREEN}✓ Successfully pushed both tags${NC}"
    fi
fi

# If using minikube or kind, offer to load the image
if command -v minikube &> /dev/null && minikube status &> /dev/null; then
    echo ""
    read -p "Load image into minikube? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Loading image into minikube...${NC}"
        minikube image load "$FULL_IMAGE_NAME"
        echo -e "${GREEN}✓ Image loaded into minikube${NC}"
    fi
elif command -v kind &> /dev/null && kind get clusters &> /dev/null; then
    echo ""
    read -p "Load image into kind? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Loading image into kind...${NC}"
        kind load docker-image "$FULL_IMAGE_NAME"
        echo -e "${GREEN}✓ Image loaded into kind${NC}"
    fi
fi

echo ""
echo -e "${GREEN}Build complete!${NC}"
echo -e "Image: ${BLUE}$FULL_IMAGE_NAME${NC}"
echo ""
echo "Next steps:"
echo "1. Create your secrets: cp k8s/base/secret-template.yaml k8s/base/secret.yaml"
echo "2. Edit k8s/base/secret.yaml with your base64-encoded secrets"
echo "3. Deploy to k8s: kubectl apply -k k8s/overlays/local"
