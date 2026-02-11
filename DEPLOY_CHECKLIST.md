# Coryphaeus Spec Reviewer — Deployment Checklist
## Your Setup: Entra ID `e5705bc7-6323-414d-9e55-d16476a66ad6`

---

## STEP 1: Create GitHub Repo (2 min)

1. Go to **github.com/new**
2. Repository name: `coryphaeus-spec-reviewer`
3. Set to **Private**
4. Click **Create repository**
5. You'll see a quick setup page — leave it open

Then in Terminal on your Mac:

```bash
# Unzip the project (download the zip from Claude first)
cd ~/Downloads
unzip coryphaeus-spec-reviewer.zip
cd coryphaeus-reviewer

# Initialize and push
git init
git add .
git commit -m "Coryphaeus Spec Reviewer v3.1 with Entra ID auth"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/coryphaeus-spec-reviewer.git
git push -u origin main
```

---

## STEP 2: Create Static Web App in Azure Portal (3 min)

1. Go to **portal.azure.com**
2. Click **"Create a resource"** (the + icon in Azure services)
3. Search for **"Static Web App"** → click **Create**
4. Fill in:

| Field | Value |
|-------|-------|
| Subscription | Your active subscription |
| Resource group | Click "Create new" → `coryphaeus-rg` |
| Name | `coryphaeus-spec-reviewer` |
| **Plan type** | **Standard** ($9/mo — needed for Entra ID auth, covered by credit) |
| Region | West US 2 |
| Source | **GitHub** |
| Organization | Your GitHub account |
| Repository | `coryphaeus-spec-reviewer` |
| Branch | `main` |

5. Under **Build Details**:

| Field | Value |
|-------|-------|
| Build Preset | **React** |
| App location | `/` |
| API location | `/api` |
| Output location | `dist` |

6. Click **Review + Create** → **Create**
7. Wait ~2 min for deployment + GitHub Actions build

---

## STEP 3: Register Entra ID App (3 min)

This creates the login for you + Stephen.

1. In Azure Portal, go to **Microsoft Entra ID** (search in top bar)
2. Left sidebar → **App registrations** → **New registration**
3. Fill in:

| Field | Value |
|-------|-------|
| Name | `Coryphaeus Spec Reviewer` |
| Supported account types | **Accounts in this organizational directory only** (Single tenant) |
| Redirect URI | **Web** → `https://<YOUR_SWA_URL>/.auth/login/aad/callback` |

   ⚠️ Get your SWA URL from the Static Web App overview page (e.g., `https://nice-river-0a1b2c3d4.5.azurestaticapps.net`)

4. Click **Register**
5. On the app overview page, copy:
   - **Application (client) ID** — you'll need this
6. Left sidebar → **Certificates & secrets** → **New client secret**
   - Description: `SWA Auth`
   - Expires: 24 months
   - Click **Add** → copy the **Value** immediately (it won't show again)

---

## STEP 4: Connect Auth to Static Web App (2 min)

1. Go back to your **Static Web App** in the portal
2. Left sidebar → **Configuration** → **Application settings**
3. Add these two settings:

| Name | Value |
|------|-------|
| `AAD_CLIENT_ID` | The Application (client) ID from Step 3 |
| `AAD_CLIENT_SECRET` | The client secret Value from Step 3 |

4. Click **Save**

---

## STEP 5: Create Storage for Comments (2 min)

1. In Azure Portal → **Create a resource** → search **"Storage account"**
2. Fill in:

| Field | Value |
|-------|-------|
| Subscription | Same subscription |
| Resource group | `coryphaeus-rg` |
| Storage account name | `coryphaeusstg` (must be lowercase, no hyphens) |
| Region | West US 2 |
| Performance | Standard |
| Redundancy | LRS (cheapest) |

3. Click **Review + Create** → **Create**
4. Once created, go to the storage account → left sidebar → **Access keys**
5. Click **Show** next to key1 → copy the **Connection string**
6. Go back to your **Static Web App** → **Configuration** → **Application settings**
7. Add:

| Name | Value |
|------|-------|
| `AZURE_STORAGE_CONNECTION_STRING` | The connection string you just copied |

8. Click **Save**

---

## STEP 6: Verify ✅

1. Open your Static Web App URL
2. You should see a Microsoft login prompt
3. Sign in with `sanju.goswami@coryph...` — you're in!
4. Navigate sections, add a comment — it persists
5. Give Stephen the URL — he logs in with his Entra ID account

---

## Add Stephen as a User

If Stephen doesn't already have an account in your Entra ID tenant:

1. **Microsoft Entra ID** → **Users** → **New user** → **Invite external user**
2. Enter Stephen's email
3. He'll get an invite and can log in with his Microsoft account

---

## Summary

| What | Where | Cost |
|------|-------|------|
| Frontend + API | Azure Static Web Apps Standard | $9/month |
| Comments DB | Azure Table Storage | ~$0.00/month |
| Auth | Entra ID Free tier | $0 |
| Custom domain + SSL | Included | $0 |
| **Total** | | **~$9/month** (covered by $200 credit) |

Every `git push` to main auto-deploys in ~2 minutes.

---

## Quick Commands Reference

```bash
# Check deployment status
az staticwebapp show --name coryphaeus-spec-reviewer --resource-group coryphaeus-rg

# Add custom domain later
az staticwebapp hostname set --name coryphaeus-spec-reviewer --hostname spec.coryphaeus.ai

# View logs
az staticwebapp functions show --name coryphaeus-spec-reviewer --resource-group coryphaeus-rg
```
