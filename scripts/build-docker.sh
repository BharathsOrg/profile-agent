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
REGISTRY="${REGISTRY:-us-west2-docker.pkg.dev/krishproject87/docker-images}"

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

# If registry is specified, tag and push to registry
if [ -n "$REGISTRY" ]; then
    REGISTRY_IMAGE_LATEST="$REGISTRY/$IMAGE_NAME:latest"
    REGISTRY_IMAGE_COMMIT="$REGISTRY/$IMAGE_NAME:$COMMIT_HASH"

    echo ""
    echo -e "${BLUE}Registry detected: $REGISTRY${NC}"
    echo -e "${BLUE}Tagging images for registry...${NC}"
    docker tag "$IMAGE_NAME:latest" "$REGISTRY_IMAGE_LATEST"
    docker tag "$IMAGE_NAME:$COMMIT_HASH" "$REGISTRY_IMAGE_COMMIT"

    echo -e "${BLUE}Pushing images to registry...${NC}"
    docker push "$REGISTRY_IMAGE_LATEST"
    docker push "$REGISTRY_IMAGE_COMMIT"
    echo -e "${GREEN}✓ Successfully pushed to registry:${NC}"
    echo -e "  - $REGISTRY_IMAGE_LATEST"
    echo -e "  - $REGISTRY_IMAGE_COMMIT"
fi

# Update kustomization with commit hash for automatic image updates
KUSTOMIZATION_FILE="$PROJECT_ROOT/k8s/overlays/local/kustomization.yaml"
if [ -f "$KUSTOMIZATION_FILE" ]; then
    echo ""
    echo -e "${BLUE}Updating kustomization with commit hash: $COMMIT_HASH${NC}"
    # Use sed to update the newTag field (handles both existing and new entries)
    if grep -q "newTag:" "$KUSTOMIZATION_FILE"; then
        sed -i "s/newTag: .*/newTag: \"$COMMIT_HASH\"/" "$KUSTOMIZATION_FILE"
    else
        # Add images section if it doesn't exist
        sed -i "/^resources:/a\\
# Use registry image with commit hash for automatic updates on deployment\\
images:\\
  - name: us-west2-docker.pkg.dev/krishproject87/docker-images/profile-agent\\
    newTag: \"$COMMIT_HASH\"\\
" "$KUSTOMIZATION_FILE"
    fi
    echo -e "${GREEN}✓ Kustomization updated with tag: $COMMIT_HASH${NC}"
fi

echo ""
echo -e "${GREEN}Build and push complete!${NC}"
echo "Next step: Deploy to Kubernetes with updated image tag"
