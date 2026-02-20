#!/usr/bin/env bash
set -euo pipefail

# Coryphaeus Teams Agent — Azure Deployment Script
# Usage: ./deploy.sh [--skip-build] [--skip-manifest]

RG="rg-coryphaeus-bot"
APP_NAME="coryphaeus-teams-agent"

SKIP_BUILD=false
SKIP_MANIFEST=false

for arg in "$@"; do
  case $arg in
    --skip-build) SKIP_BUILD=true ;;
    --skip-manifest) SKIP_MANIFEST=true ;;
  esac
done

echo "=== Coryphaeus Teams Agent Deployment ==="
echo ""

# ── Step 1: Verify Azure CLI login ──────────────────────────────────
echo "[1/5] Checking Azure CLI..."
if ! az account show &>/dev/null; then
  echo "  Not logged in. Running az login..."
  az login --tenant e5705bc7-6323-414d-9e55-d16476a66ad6
fi
echo "  Logged in as: $(az account show --query user.name -o tsv)"
echo ""

# ── Step 2: Build ────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = false ]; then
  echo "[2/5] Building..."
  npm install
  npx tsc
  npx -y bestzip deploy.zip package.json package-lock.json dist/
  echo "  Built deploy.zip ($(du -h deploy.zip | cut -f1))"
else
  echo "[2/5] Build skipped (--skip-build)"
fi
echo ""

# ── Step 3: Configure App Settings ──────────────────────────────────
echo "[3/5] Updating app settings..."
echo "  Ensuring WebSockets are enabled on App Service..."
az webapp config set \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --web-sockets-enabled true \
  --output none

# Remind about required env vars
echo ""
echo "  Verify these app settings are configured (set manually if missing):"
echo "    BOT_ID, BOT_PASSWORD, BOT_TENANT_ID"
echo "    ANTHROPIC_API_KEY, CLAUDE_MODEL"
echo "    DATABASE_URL"
echo ""
echo "  To set a missing variable:"
echo "    az webapp config appsettings set --resource-group $RG --name $APP_NAME --settings KEY=value"
echo ""

# Show current settings (names only)
echo "  Current app settings:"
az webapp config appsettings list \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --query "[].name" -o tsv | sed 's/^/    /'
echo ""

# ── Step 4: Deploy zip ──────────────────────────────────────────────
echo "[4/5] Deploying to Azure App Service..."
az webapp deployment source config-zip \
  --resource-group "$RG" \
  --name "$APP_NAME" \
  --src deploy.zip \
  --output none
echo "  Deployed successfully."
echo ""

# ── Step 5: Update Teams manifest ───────────────────────────────────
if [ "$SKIP_MANIFEST" = false ]; then
  echo "[5/5] Teams manifest updated (coryphaeus-teams-app.zip)"
  echo ""
  echo "  To update the Teams app:"
  echo "    1. Open Teams → Apps → Manage your apps"
  echo "    2. Find Coryphaeus → Update"
  echo "    3. Upload bot/coryphaeus-teams-app.zip"
  echo ""
  echo "  Or via Teams Admin Center for org-wide update."
else
  echo "[5/5] Manifest update skipped (--skip-manifest)"
fi

# ── Verify ───────────────────────────────────────────────────────────
echo ""
echo "=== Verifying deployment ==="
sleep 5  # Give App Service a moment to restart

HEALTH_URL="https://${APP_NAME}.azurewebsites.net/api/health"
echo "  Health check: $HEALTH_URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "  Status: HEALTHY"
  curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || curl -s "$HEALTH_URL"
else
  echo "  Status: UNHEALTHY (HTTP $HTTP_CODE)"
  echo "  Check logs: az webapp log tail --resource-group $RG --name $APP_NAME"
fi

echo ""
echo "=== Done ==="
