#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# E-Invite — Package Script
# Creates a distributable ZIP archive of the entire project
# ──────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="e-invite"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="${SCRIPT_DIR}/.."
ZIP_NAME="${PROJECT_NAME}-v${VERSION}-${TIMESTAMP}.zip"
OUTPUT_PATH="${OUTPUT_DIR}/${ZIP_NAME}"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          E-Invite — Project Packager                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  Version:  ${VERSION}"
echo "  Output:   ${ZIP_NAME}"
echo ""

cd "$SCRIPT_DIR"

# Clean build artifacts that shouldn't be packaged
echo "→ Cleaning temporary files..."
rm -rf .next node_modules/.cache

# Check if zip command is available
if ! command -v zip &>/dev/null; then
  echo "Error: 'zip' command not found. Install it with:"
  echo "  Ubuntu/Debian: sudo apt install zip"
  echo "  macOS: brew install zip"
  exit 1
fi

echo "→ Creating ZIP archive..."

cd "$OUTPUT_DIR"

zip -r "$ZIP_NAME" "$PROJECT_NAME/" \
  -x "${PROJECT_NAME}/node_modules/*" \
  -x "${PROJECT_NAME}/.next/*" \
  -x "${PROJECT_NAME}/.env" \
  -x "${PROJECT_NAME}/public/uploads/photos/*" \
  -x "${PROJECT_NAME}/public/uploads/music/*" \
  -x "${PROJECT_NAME}/.git/*" \
  -x "${PROJECT_NAME}/prisma/*.db" \
  -x "${PROJECT_NAME}/prisma/*.db-journal" \
  -x "${PROJECT_NAME}/tsconfig.tsbuildinfo" \
  -x "*.DS_Store"

# Keep .gitkeep files for upload directories
zip "$ZIP_NAME" \
  "${PROJECT_NAME}/public/uploads/photos/.gitkeep" \
  "${PROJECT_NAME}/public/uploads/music/.gitkeep" \
  2>/dev/null || true

ZIP_SIZE=$(du -sh "$ZIP_NAME" | cut -f1)

echo ""
echo "✓ Package created successfully!"
echo ""
echo "  File:  ${OUTPUT_PATH}"
echo "  Size:  ${ZIP_SIZE}"
echo ""
echo "To deploy:"
echo "  1. Copy the ZIP to your server"
echo "  2. unzip ${ZIP_NAME}"
echo "  3. cd ${PROJECT_NAME}"
echo "  4. chmod +x install.sh && sudo ./install.sh"
echo ""
