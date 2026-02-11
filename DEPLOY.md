# Coryphaeus Spec Reviewer — Azure Deployment Guide

## Architecture

```
Azure Static Web Apps (Free Tier)
├── Frontend: Vite + React SPA (auto-built from /src)
├── API: Azure Functions (Node.js, serverless, in /api)
└── Storage: Azure Table Storage (comments database)
```

**Cost: $0/month** on Free tier (includes 100GB bandwidth, 2 custom domains, serverless API)

---

## Prerequisites

1. **Azure subscription** — activate free trial at portal.azure.com ($200 credit)
2. **GitHub account** — push code to a repo (SWA auto-deploys from GitHub)
3. **Node.js 18+** installed locally
4. **Azure CLI** — `brew install azure-cli` (or see https://aka.ms/installazurecli)

---

## Step 1: Push to GitHub

```bash
# In the coryphaeus-reviewer folder:
cd coryphaeus-reviewer
git init
git add .
git commit -m "Coryphaeus Spec Reviewer v3.1"

# Create a GitHub repo (private is fine)
gh repo create coryphaeus-spec-reviewer --private --push
# OR manually create on github.com and:
git remote add origin https://github.com/YOUR_USERNAME/coryphaeus-spec-reviewer.git
git push -u origin main
```

---

## Step 2: Create Azure Static Web App

### Option A: Azure Portal (Recommended for first time)

1. Go to **portal.azure.com**
2. Click **"Create a resource"** → search **"Static Web App"** → Create
3. Fill in:
   - **Subscription**: Your free trial
   - **Resource group**: Create new → `coryphaeus-rg`
   - **Name**: `coryphaeus-spec-reviewer`
   - **Plan type**: **Free**
   - **Region**: West US 2 (or nearest)
   - **Source**: **GitHub**
   - **Sign in to GitHub** and select your repo
   - **Branch**: `main`
   - **Build preset**: **React**
   - **App location**: `/`
   - **API location**: `/api`
   - **Output location**: `dist`
4. Click **Review + Create** → **Create**

Azure automatically creates a GitHub Actions workflow that builds and deploys on every push.

### Option B: Azure CLI (Faster)

```bash
# Login
az login

# Create resource group
az group create --name coryphaeus-rg --location westus2

# Create Static Web App (connects to GitHub)
az staticwebapp create \
  --name coryphaeus-spec-reviewer \
  --resource-group coryphaeus-rg \
  --source https://github.com/YOUR_USERNAME/coryphaeus-spec-reviewer \
  --branch main \
  --app-location "/" \
  --api-location "/api" \
  --output-location "dist" \
  --login-with-github
```

---

## Step 3: Add Storage for Comments

The API needs Azure Table Storage to persist comments.

```bash
# Create a storage account (name must be globally unique, lowercase, no hyphens)
az storage account create \
  --name coryphaeusstg \
  --resource-group coryphaeus-rg \
  --location westus2 \
  --sku Standard_LRS

# Get the connection string
az storage account show-connection-string \
  --name coryphaeusstg \
  --resource-group coryphaeus-rg \
  --query connectionString -o tsv
```

Copy the connection string (starts with `DefaultEndpointsProtocol=https;...`).

```bash
# Add it to your Static Web App as an environment variable
az staticwebapp appsettings set \
  --name coryphaeus-spec-reviewer \
  --resource-group coryphaeus-rg \
  --setting-names \
    AZURE_STORAGE_CONNECTION_STRING="<paste-connection-string-here>"
```

---

## Step 4: Verify Deployment

After GitHub Actions completes (~2 minutes):

1. Go to **portal.azure.com** → your Static Web App
2. Click the **URL** (e.g., `https://coryphaeus-spec-reviewer.azurestaticapps.net`)
3. The spec reviewer should load with all 19 sections
4. Try adding a comment — it persists across sessions

---

## Step 5: Custom Domain (Optional)

```bash
# Add your own domain
az staticwebapp hostname set \
  --name coryphaeus-spec-reviewer \
  --resource-group coryphaeus-rg \
  --hostname spec.coryphaeus.ai
```

Then add a CNAME record in your DNS:
- **Type**: CNAME
- **Name**: `spec`
- **Value**: `coryphaeus-spec-reviewer.azurestaticapps.net`

Free SSL certificate is auto-provisioned.

---

## Step 6: Add Authentication (Optional)

To restrict access to you and Stephen, add to `staticwebapp.config.json`:

```json
{
  "auth": {
    "identityProviders": {
      "azureActiveDirectory": {
        "registration": {
          "openIdIssuer": "https://login.microsoftonline.com/<YOUR_TENANT_ID>/v2.0",
          "clientIdSettingName": "AAD_CLIENT_ID",
          "clientSecretSettingName": "AAD_CLIENT_SECRET"
        }
      }
    }
  },
  "routes": [
    {
      "route": "/*",
      "allowedRoles": ["authenticated"]
    },
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

This uses your CORYPHAEUS AI Entra ID tenant — only members can access.

---

## Local Development

```bash
# Install dependencies
cd coryphaeus-reviewer
npm install
cd api && npm install && cd ..

# Start frontend dev server
npm run dev

# In another terminal, start API (requires Azure Functions Core Tools)
# Install: npm install -g azure-functions-core-tools@4
cd api && func start

# Or use SWA CLI for integrated local dev
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --api-location ./api
```

---

## Updating the Spec

When you update the spec to v3.2+:

1. Edit `src/App.jsx` — update the `S` data array and `VERSIONS`
2. Commit and push to GitHub
3. Auto-deploys in ~2 minutes

---

## Cost Summary

| Resource | Monthly Cost |
|----------|-------------|
| Static Web App (Free) | $0 |
| Azure Functions (included) | $0 |
| Table Storage (~1KB comments) | $0.00 |
| Custom domain + SSL | $0 |
| **Total** | **$0/month** |

The entire stack runs free. Table Storage costs ~$0.036/GB/month — comments will be well under 1MB.

---

## Troubleshooting

**Build fails**: Check GitHub Actions tab in your repo for error logs.

**API returns 500**: Check that `AZURE_STORAGE_CONNECTION_STRING` is set in app settings.

**Comments don't persist**: The app falls back to localStorage if the API is unavailable. Check browser console for errors.

**Custom domain not working**: DNS propagation can take up to 48 hours. Verify CNAME with `dig spec.coryphaeus.ai`.
