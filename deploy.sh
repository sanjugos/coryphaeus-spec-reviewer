#!/bin/bash
# ============================================================
# Coryphaeus Spec Reviewer — Full Azure Deployment Script
# Run this from the directory containing the unzipped project
# ============================================================
set -e

echo "🚀 Coryphaeus Spec Reviewer Deployment"
echo "========================================"
echo ""

# ── Prerequisites check ──
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI not found. Install: brew install azure-cli"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "❌ GitHub CLI not found. Install: brew install gh"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not found. Install: xcode-select --install"; exit 1; }

# ── Configuration ──
RESOURCE_GROUP="coryphaeus-rg"
LOCATION="westus2"
SWA_NAME="coryphaeus-spec-reviewer"
STORAGE_NAME="coryphaeusstg"
GITHUB_REPO="coryphaeus-spec-reviewer"
TENANT_ID="e5705bc7-6323-414d-9e55-d16476a66ad6"

echo "📋 Config:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Location: $LOCATION"
echo "   Static Web App: $SWA_NAME"
echo "   Storage: $STORAGE_NAME"
echo ""

# ── Step 1: Azure Login ──
echo "🔐 Step 1: Logging into Azure..."
az account show >/dev/null 2>&1 || az login
echo "   ✅ Logged in as: $(az account show --query user.name -o tsv)"
echo ""

# ── Step 2: Create GitHub Repo ──
echo "📦 Step 2: Creating GitHub repo..."
gh auth status >/dev/null 2>&1 || gh auth login
cd "$(dirname "$0")"

# Initialize git if needed
if [ ! -d .git ]; then
    git init
    git add .
    git commit -m "Coryphaeus Spec Reviewer v3.1 with Entra ID auth"
fi

# Create repo and push
if gh repo view "$GITHUB_REPO" >/dev/null 2>&1; then
    echo "   Repo already exists, pushing..."
else
    gh repo create "$GITHUB_REPO" --private --source=. --push
fi
git push -u origin main 2>/dev/null || git push origin main
GITHUB_URL=$(gh repo view --json url -q .url)
echo "   ✅ GitHub: $GITHUB_URL"
echo ""

# ── Step 3: Create Resource Group ──
echo "🏗️  Step 3: Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo "   ✅ Resource group: $RESOURCE_GROUP"
echo ""

# ── Step 4: Create Static Web App ──
echo "🌐 Step 4: Creating Static Web App..."
GITHUB_USER=$(gh api user --jq .login)
az staticwebapp create \
    --name $SWA_NAME \
    --resource-group $RESOURCE_GROUP \
    --source "https://github.com/$GITHUB_USER/$GITHUB_REPO" \
    --branch main \
    --app-location "/" \
    --api-location "/api" \
    --output-location "dist" \
    --login-with-github \
    --sku Standard \
    --output none 2>/dev/null || echo "   (SWA may already exist)"

SWA_URL=$(az staticwebapp show --name $SWA_NAME --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv)
echo "   ✅ URL: https://$SWA_URL"
echo ""

# ── Step 5: Create Storage Account ──
echo "💾 Step 5: Creating storage account for comments..."
az storage account create \
    --name $STORAGE_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --sku Standard_LRS \
    --output none 2>/dev/null || echo "   (Storage may already exist)"

STORAGE_CONN=$(az storage account show-connection-string \
    --name $STORAGE_NAME \
    --resource-group $RESOURCE_GROUP \
    --query connectionString -o tsv)
echo "   ✅ Storage account: $STORAGE_NAME"
echo ""

# ── Step 6: Register Entra ID App ──
echo "🔒 Step 6: Registering Entra ID app..."
REDIRECT_URI="https://$SWA_URL/.auth/login/aad/callback"

# Check if app already exists
EXISTING_APP=$(az ad app list --display-name "Coryphaeus Spec Reviewer" --query "[0].appId" -o tsv 2>/dev/null)

if [ -n "$EXISTING_APP" ]; then
    AAD_CLIENT_ID=$EXISTING_APP
    echo "   App already exists: $AAD_CLIENT_ID"
else
    AAD_CLIENT_ID=$(az ad app create \
        --display-name "Coryphaeus Spec Reviewer" \
        --sign-in-audience AzureADMyOrg \
        --web-redirect-uris "$REDIRECT_URI" \
        --query appId -o tsv)
    echo "   ✅ App registered: $AAD_CLIENT_ID"
fi

# Create client secret
AAD_CLIENT_SECRET=$(az ad app credential reset \
    --id $AAD_CLIENT_ID \
    --display-name "SWA Auth" \
    --years 2 \
    --query password -o tsv)
echo "   ✅ Client secret created"
echo ""

# ── Step 7: Configure App Settings ──
echo "⚙️  Step 7: Setting app configuration..."
az staticwebapp appsettings set \
    --name $SWA_NAME \
    --resource-group $RESOURCE_GROUP \
    --setting-names \
        "AAD_CLIENT_ID=$AAD_CLIENT_ID" \
        "AAD_CLIENT_SECRET=$AAD_CLIENT_SECRET" \
        "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CONN" \
    --output none
echo "   ✅ All secrets configured"
echo ""

# ── Done! ──
echo "========================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""
echo "🌐 URL: https://$SWA_URL"
echo "🔐 Auth: Entra ID tenant $TENANT_ID"
echo "📦 GitHub: $GITHUB_URL"
echo "💾 Storage: $STORAGE_NAME"
echo "🆔 Client ID: $AAD_CLIENT_ID"
echo ""
echo "Next steps:"
echo "  1. Open https://$SWA_URL"
echo "  2. Sign in with your Microsoft account"
echo "  3. Wait ~2 min for GitHub Actions to finish the first build"
echo "  4. Invite Stephen: Azure Portal → Entra ID → Users → Invite"
echo ""
echo "Every 'git push' to main auto-deploys in ~2 minutes."
