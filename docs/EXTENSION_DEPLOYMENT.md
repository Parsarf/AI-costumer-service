# Theme App Extension Deployment Guide

This guide explains how to build and deploy the AI Assistant Widget as a Theme App Extension for Shopify stores.

## Overview

The AI Assistant Widget is implemented as a **Theme App Extension** instead of the deprecated Script Tag approach. This provides:

- ✅ Better performance and reliability
- ✅ Native Shopify theme integration
- ✅ No `write_themes` scope required
- ✅ Merchant-controlled placement via Theme Editor
- ✅ Better mobile experience

## Prerequisites

- Shopify CLI installed (`npm install -g @shopify/cli`)
- Shopify Partner account
- App already created in Partner Dashboard
- Backend API running and accessible

## Required Scopes

The app only needs these scopes (NO `write_themes` required for App Blocks):

```json
{
  "scopes": [
    "read_products",
    "read_orders", 
    "read_customers"
  ]
}
```

## Building the Widget

### 1. Build React Widget

```bash
cd chat-widget
npm install
npm run build-extension
```

This command:
- Builds the React app for production
- Copies the built JS/CSS files to `extensions/assistant-widget/assets/`
- Renames them to `assistant-widget.js` and `assistant-widget.css`

### 2. Verify Build Output

Check that these files exist:
```
extensions/assistant-widget/assets/
├── assistant-widget.js    (built from React)
└── assistant-widget.css   (built from React)
```

## Deploying the Extension

### 1. Login to Shopify CLI

```bash
shopify auth login
```

### 2. Navigate to Extension Directory

```bash
cd extensions/assistant-widget
```

### 3. Deploy Extension

```bash
shopify app deploy
```

This will:
- Upload the extension to your app
- Make it available in the Theme Editor
- Update the extension if it already exists

### 4. Verify Deployment

Check your Partner Dashboard:
1. Go to your app
2. Click "Extensions" tab
3. Verify "AI Assistant Widget" is listed
4. Check status is "Active"

## Merchant Setup Instructions

### 1. Install App

Merchants install your app through the Shopify App Store or Partner Dashboard.

### 2. Enable Extension in Theme

After installation, merchants need to:

1. Go to **Online Store** → **Themes**
2. Click **Customize** on their active theme
3. Go to **App embeds** section
4. Find **AI Assistant Widget**
5. Click **Add** to enable it
6. Configure settings:
   - Welcome message
   - Widget color
   - Position (bottom-right/left)
   - Show on mobile
   - Auto-open delay

### 3. Save and Publish

1. Click **Save** in Theme Editor
2. Click **Publish** to make changes live

## Configuration Options

The extension supports these settings via Theme Editor:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `welcome_message` | Text | "Hi! How can I help you today?" | First message customers see |
| `primary_color` | Color | "#4F46E5" | Widget color theme |
| `position` | Select | "bottom-right" | Widget position on page |
| `show_on_mobile` | Checkbox | true | Show on mobile devices |
| `auto_open_delay` | Range | 0 | Auto-open delay in seconds |

## App Proxy Configuration

The widget communicates with your backend via **App Proxy**:

### 1. Configure App Proxy

In your Partner Dashboard:
1. Go to your app settings
2. Click **App setup**
3. Scroll to **App proxy**
4. Set:
   - **Subpath prefix**: `aibot`
   - **Subpath**: `chat`
   - **URL**: `https://your-app.railway.app/proxy`

### 2. Update Widget Code

The widget automatically calls `/apps/aibot/chat` which Shopify routes to your backend.

## Troubleshooting

### Extension Not Appearing

**Problem**: Extension doesn't show in Theme Editor

**Solutions**:
- Verify deployment: `shopify app deploy`
- Check app is installed on store
- Refresh Theme Editor page
- Check Partner Dashboard for errors

### Widget Not Loading

**Problem**: Widget appears but doesn't load

**Solutions**:
- Check browser console for errors
- Verify App Proxy is configured correctly
- Check backend API is running
- Verify shop domain is correct

### Styling Issues

**Problem**: Widget looks broken or unstyled

**Solutions**:
- Rebuild widget: `npm run build-extension`
- Redeploy extension: `shopify app deploy`
- Check CSS file is copied correctly
- Clear browser cache

### API Errors

**Problem**: Chat doesn't work, API errors

**Solutions**:
- Check App Proxy configuration
- Verify backend is accessible
- Check CORS settings
- Verify shop parameter is passed

## Development Workflow

### 1. Make Changes

Edit files in `chat-widget/src/` or `extensions/assistant-widget/`

### 2. Rebuild

```bash
cd chat-widget
npm run build-extension
```

### 3. Redeploy

```bash
cd extensions/assistant-widget
shopify app deploy
```

### 4. Test

- Refresh store's Theme Editor
- Test widget functionality
- Check for console errors

## Production Checklist

Before going live:

- [ ] Widget builds without errors
- [ ] Extension deploys successfully
- [ ] App Proxy is configured
- [ ] Backend API is accessible
- [ ] All settings work in Theme Editor
- [ ] Widget works on mobile
- [ ] No console errors
- [ ] Chat functionality works
- [ ] Styling looks correct
- [ ] Performance is acceptable

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify all configuration steps
3. Test on different themes
4. Check Partner Dashboard for app status
5. Review Shopify CLI logs

## Migration from Script Tags

If migrating from Script Tag approach:

1. Deploy Theme App Extension
2. Instruct merchants to enable in Theme Editor
3. Remove old script tag code (already done)
4. Update documentation
5. Test thoroughly

The Theme App Extension approach is more reliable and provides better merchant control.

