# Discord Bot Setup Guide

This guide will walk you through creating a Discord application and getting your bot tokens.

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click the **"New Application"** button (top right)
3. Give your application a name (e.g., "Llama Bot")
4. Click **"Create"**

## Step 2: Get Your Application ID (DISCORD_APP_ID)

1. In your application dashboard, go to the **"General Information"** tab (should be open by default)
2. Under **"Application ID"**, click the **"Copy"** button
3. This is your `DISCORD_APP_ID` - save it for later

## Step 3: Create a Bot

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"** (or "Reset Token" if you already have one)
3. Click **"Yes, do it!"** to confirm

## Step 4: Get Your Bot Token (DISCORD_TOKEN)

1. In the **"Bot"** section, under **"Token"**, click **"Reset Token"** (if needed)
2. Click **"Copy"** to copy your bot token
3. ⚠️ **IMPORTANT**: Keep this token secret! Never share it publicly or commit it to Git
4. This is your `DISCORD_TOKEN` - save it securely

## Step 5: Enable Bot Privileges

Still in the **"Bot"** section, scroll down to **"Privileged Gateway Intents"** and enable:

- ✅ **Presence Intent** (if you need user presence data)
- ✅ **Server Members Intent** (if you need member list)
- ✅ **Message Content Intent** (required for reading message content)

For basic slash commands, you may not need all of these, but enabling them won't hurt.

## Step 6: Get Your Server/Guild ID (DISCORD_GUILD_ID)

This is for registering commands in a specific server during development:

1. In Discord, enable **Developer Mode**:

   - Go to User Settings → Advanced
   - Enable **"Developer Mode"**

2. Right-click on your Discord server (where you want to test the bot)
3. Click **"Copy Server ID"**
4. This is your `DISCORD_GUILD_ID` - save it for later

## Step 7: Invite Bot to Your Server

1. In the Developer Portal, go to **"OAuth2"** → **"URL Generator"**
2. Under **"Scopes"**, select:
   - ✅ **bot**
   - ✅ **applications.commands** (for slash commands)
3. Under **"Bot Permissions"**, select the permissions you need:
   - ✅ **Send Messages**
   - ✅ **Read Message History**
   - ✅ **Use Slash Commands**
   - ✅ **Embed Links** (optional)
   - Add more as needed
4. Copy the generated URL at the bottom
5. Open the URL in your browser and select your server
6. Click **"Authorize"** and complete the CAPTCHA

## Step 8: Add Secrets to Your .env File

1. Copy the example environment file:

   ```bash
   cp infra/.env.example infra/.env
   ```

2. Edit `infra/.env` and add your values:

   ```env
   DISCORD_TOKEN=your-bot-token-here
   DISCORD_APP_ID=your-application-id-here
   DISCORD_GUILD_ID=your-server-id-here
   ```

3. Make sure `infra/.env` is in your `.gitignore` (it should be already)

## Quick Reference

- **Developer Portal**: https://discord.com/developers/applications
- **Application ID**: Found in "General Information"
- **Bot Token**: Found in "Bot" section
- **Guild ID**: Right-click server → Copy Server ID (with Developer Mode enabled)

## Security Tips

- ✅ Never commit `.env` files to Git
- ✅ Never share your bot token publicly
- ✅ If you accidentally share your token, regenerate it immediately in the Developer Portal
- ✅ Use environment variables in production
- ✅ Consider using a secrets manager for production deployments

## Troubleshooting

**Bot doesn't appear in server:**

- Make sure you completed the OAuth2 invite process
- Check that you have permission to add bots to the server

**Commands not showing up:**

- Wait a few minutes after registering (Discord caches commands)
- Make sure you enabled "applications.commands" scope when inviting
- Try refreshing Discord or restarting it

**"Invalid token" error:**

- Double-check you copied the full token
- Make sure there are no extra spaces
- Regenerate the token if needed
