#!/bin/bash
set -e

# SuccessForce Template Publisher
# Usage: ./publish-release.sh <VERSION>

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Error: Version argument required."
  echo "Usage: ./publish-release.sh <VERSION>"
  exit 1
fi

echo "======================================"
echo "Publishing Release v$VERSION"
echo "======================================"

# Step 1: Version Validation
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [ "$PACKAGE_VERSION" != "$VERSION" ]; then
  echo "Error: package.json version ($PACKAGE_VERSION) does not match requested version ($VERSION)."
  exit 1
fi

SF_VERSION=$(cat .sf-version)
if [ "$SF_VERSION" != "$VERSION" ]; then
  echo "Error: .sf-version ($SF_VERSION) does not match requested version ($VERSION)."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Error: You have uncommitted changes. Please commit or stash them before publishing."
  exit 1
fi

# Step 2: Pre-flight Build
echo "[1/4] Running pre-flight build..."
pnpm install --frozen-lockfile
NODE_ENV=production pnpm build

# Step 3: Artifact Generation
echo "[2/4] Generating release tarballs..."
tar -czf sf-template-v${VERSION}-source.tar.gz \
  src/ public/ scripts/ pb_migrations/ \
  package.json pnpm-lock.yaml postcss.config.mjs tsconfig.json next.config.ts \
  .sf-version README.md
tar -czf sf-template-v${VERSION}-build.tar.gz .next/

# Step 4: Cryptographic Checksums
echo "[3/4] Generating cryptographic checksums..."
sha256sum sf-template-v${VERSION}-source.tar.gz sf-template-v${VERSION}-build.tar.gz > checksums.sha256

# Step 5: Registry Update
echo "[4/4] Copying artifacts to local registry..."
REGISTRY_DIR="/opt/sf-registry"
RELEASE_DIR="${REGISTRY_DIR}/releases/v${VERSION}"

mkdir -p "$RELEASE_DIR"
cp sf-template-v${VERSION}-source.tar.gz "$RELEASE_DIR/source.tar.gz"
cp sf-template-v${VERSION}-build.tar.gz "$RELEASE_DIR/build.tar.gz"
cp checksums.sha256 "$RELEASE_DIR/checksums.sha256"

echo "Updating manifest.json..."
if [ -f "$REGISTRY_DIR/manifest.json" ]; then
  cp "$REGISTRY_DIR/manifest.json" current-manifest.json
else
  echo '{"channels": {"stable": {}}, "versions": []}' > current-manifest.json
fi

# Using jq to update the manifest
jq --arg version "$VERSION" \
   --arg date "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
   --arg source "file://${RELEASE_DIR}/source.tar.gz" \
   --arg build "file://${RELEASE_DIR}/build.tar.gz" \
   --arg checksums "file://${RELEASE_DIR}/checksums.sha256" \
   '.channels.stable.version = $version | 
    .channels.stable.released_at = $date | 
    .channels.stable.source_url = $source | 
    .channels.stable.build_url = $build | 
    .channels.stable.checksums_url = $checksums | 
    .versions += [{"version": $version, "channel": "stable", "released_at": $date}]' \
   current-manifest.json > new-manifest.json

cp new-manifest.json "$REGISTRY_DIR/manifest.json"

echo "Cleaning up..."
rm sf-template-v${VERSION}-source.tar.gz
rm sf-template-v${VERSION}-build.tar.gz
rm checksums.sha256
rm current-manifest.json new-manifest.json

echo "======================================"
echo "Successfully published v$VERSION!"
echo "======================================"
