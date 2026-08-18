#!/bin/bash
# DARKO — Push to your own GitHub repository
#
# Usage:
#   1. Create a new repo on GitHub (don't add a README/license/.gitignore)
#   2. Copy the HTTPS URL GitHub shows you (e.g. https://github.com/yourname/darko.git)
#   3. Run:  ./push-to-github.sh https://github.com/yourname/darko.git
#
# Or set DARKO_REMOTE once and run without args:
#   export DARKO_REMOTE=https://github.com/yourname/darko.git
#   ./push-to-github.sh

set -euo pipefail

REMOTE="${1:-${DARKO_REMOTE:-}}"
if [ -z "$REMOTE" ]; then
  echo "❌ No remote specified."
  echo ""
  echo "Usage:"
  echo "  ./push-to-github.sh https://github.com/yourname/darko.git"
  echo ""
  echo "Or set DARKO_REMOTE env var first:"
  echo "  export DARKO_REMOTE=https://github.com/yourname/darko.git"
  echo "  ./push-to-github.sh"
  exit 1
fi

cd "$(dirname "$0")/.."

echo "📦 Pushing DARKO to: $REMOTE"
echo ""

# Add the remote (or update URL if it exists)
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
  echo "✓ Updated origin to $REMOTE"
else
  git remote add origin "$REMOTE"
  echo "✓ Added origin remote"
fi

# Push
echo ""
echo "🚀 Pushing..."
git push -u origin main

echo ""
echo "✅ Done! Your DARKO repo is at: $REMOTE"
echo ""
echo "To update later, just commit and run:"
echo "  git push"
