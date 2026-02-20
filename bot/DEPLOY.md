# Coryphaeus Teams Agent — Deployment Guide

## Prerequisites

- Azure subscription (same tenant as Coryphaeus CRM)
- Node.js 18+ installed
- Azure CLI (`az`) installed
- Teams admin access for app sideloading

## Step 1: Azure Bot Registration

```bash
# Login to Azure
az login --tenant e5705bc7-6323-414d-9e55-d16476a66ad6

# Create resource group (if not existing)
az group create --name rg-coryphaeus-bot --location eastus

# Create Azure Bot (single-tenant)
az bot create \
  --resource-group rg-coryphaeus-bot \
  --name coryphaeus-teams-agent \
  --app-type SingleTenant \
  --tenant-id e5705bc7-6323-414d-9e55-d16476a66ad6 \
  --sku F0
```

After creation, note the **App ID** and **App Password** from the Azure portal.

## Step 2: Configure Environment

```bash
cd bot
cp .env.example .env
```

Edit `.env` with your values:
- `BOT_ID` — Azure Bot App ID
- `BOT_PASSWORD` — Azure Bot App Password
- `ANTHROPIC_API_KEY` — Your Anthropic API key
- `AZURE_STORAGE_CONNECTION_STRING` — For CRM data (when connecting to real data)

## Step 3: Build and Test Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the bot
npm start
```

The bot runs on `http://localhost:3978/api/messages`.

### Local Testing with Bot Framework Emulator

1. Download [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator/releases)
2. Connect to `http://localhost:3978/api/messages`
3. Enter your Bot ID and Password
4. Send test messages like "What are my top deals?"

### Local Testing with Teams (Dev Tunnel)

```bash
# Install dev tunnels
npm install -g @microsoft/dev-tunnels-cli

# Create and start tunnel
devtunnel create --allow-anonymous
devtunnel port create -p 3978
devtunnel host
```

Use the tunnel URL as your bot messaging endpoint in Azure Bot configuration.

## Step 4: Deploy to Azure App Service

```bash
# Create App Service Plan
az appservice plan create \
  --resource-group rg-coryphaeus-bot \
  --name plan-coryphaeus-bot \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group rg-coryphaeus-bot \
  --plan plan-coryphaeus-bot \
  --name coryphaeus-teams-agent \
  --runtime "NODE:18-lts"

# Configure environment variables
az webapp config appsettings set \
  --resource-group rg-coryphaeus-bot \
  --name coryphaeus-teams-agent \
  --settings \
    BOT_ID="<your-bot-id>" \
    BOT_PASSWORD="<your-bot-password>" \
    BOT_TENANT_ID="e5705bc7-6323-414d-9e55-d16476a66ad6" \
    ANTHROPIC_API_KEY="<your-key>" \
    CLAUDE_MODEL="claude-sonnet-4-6" \
    WEBSITE_NODE_DEFAULT_VERSION="18-lts"

# Deploy code
az webapp deployment source config-zip \
  --resource-group rg-coryphaeus-bot \
  --name coryphaeus-teams-agent \
  --src dist.zip
```

## Step 5: Configure Bot Messaging Endpoint

In Azure Portal:
1. Go to your Bot resource → Configuration
2. Set Messaging endpoint to: `https://coryphaeus-teams-agent.azurewebsites.net/api/messages`
3. Enable the **Microsoft Teams** channel

## Step 6: Create Teams App Package

1. Replace `${{BOT_ID}}` in `appPackage/manifest.json` with your actual Bot ID
2. Replace `${{BOT_DOMAIN}}` with `coryphaeus-teams-agent.azurewebsites.net`
3. Add 192x192 `color.png` and 32x32 `outline.png` icons to `appPackage/`
4. Zip the contents: `cd appPackage && zip -r ../coryphaeus.zip *`

## Step 7: Install in Teams

### For Development (Sideload)
1. Open Teams → Apps → Manage your apps → Upload a custom app
2. Upload `coryphaeus.zip`
3. Add to a chat or team

### For Organization (Admin)
1. Go to Teams Admin Center → Teams apps → Manage apps
2. Upload `coryphaeus.zip` as an org app
3. Configure app permission policies as needed

## Step 8: Test

1. Open a 1:1 chat with **Coryphaeus**
2. Try: "What are my top deals?"
3. Try: "Tell me about Northwind Traders"
4. Try: "Summarize my activity for the past week"
5. Add to a group chat and @mention the bot

## Enabling Meeting Participation (Phase 2)

To enable the bot to join meetings as a participant:

1. Update `manifest.json`: set `supportsCalling: true`
2. Add Graph API permissions: `Calls.JoinGroupCall.All`, `Calls.AccessMedia.All`
3. Get tenant admin consent for these permissions
4. Configure the calling webhook endpoint in Azure Bot settings

For real-time audio processing (Phase 3), a separate C# .NET service is required.
See the architecture plan for details.
