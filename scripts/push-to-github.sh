#!/usr/bin/env bash
# Push the WASLA repository to GitHub.
#
# Prerequisite (one time): create an EMPTY repository on GitHub — no README,
# no .gitignore — e.g. named "wasla". Then run:
#
#   bash scripts/push-to-github.sh https://github.com/<your-user>/wasla.git
#
# (Git will use your local GitHub credentials; on a fresh machine you may be
# asked to authenticate once via the browser.)
set -euo pipefail

REMOTE_URL="${1:-}"
if [ -z "$REMOTE_URL" ]; then
  echo "Usage: bash scripts/push-to-github.sh <your-repo-git-url>"
  echo "Example: bash scripts/push-to-github.sh https://github.com/your-user/wasla.git"
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  git remote add origin "$REMOTE_URL"
else
  git remote set-url origin "$REMOTE_URL"
fi

echo "Pushing main → $REMOTE_URL ..."
git push -u origin main
echo "Done. Your code is live on GitHub."
