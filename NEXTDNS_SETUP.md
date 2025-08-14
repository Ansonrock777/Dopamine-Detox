# NextDNS Integration Setup Guide

## The Issue
When you add a domain to your Dopamine Detox app, it gets saved to Supabase but doesn't appear in your NextDNS denylist. This happens because the NextDNS integration needs to be configured first.

## Solution Steps

### 1. Create/Login to NextDNS Account
1. Go to [https://nextdns.io](https://nextdns.io)
2. Create an account or log in if you already have one
3. Choose a free or paid plan

### 2. Get Your API Credentials
1. Go to [https://my.nextdns.io/account](https://my.nextdns.io/account)
2. Click **"Generate API Key"** and copy the generated key (40-character string)
3. Go to **Setup** → **Endpoints**
4. Copy your **Profile ID** (usually 6 characters like `abc123`)

### 3. Configure in Your App
1. Open your Dopamine Detox dashboard
2. Scroll to the **"NextDNS Integration"** section
3. Click **"Connect NextDNS"**
4. Enter:
   - **API Key**: Paste the 40-character key from step 2
   - **Profile ID**: Paste the 6-character ID from step 2
   - **Profile Name**: Enter "Dopamine Detox" (or any name you prefer)
5. Click **"Connect Account"**

### 4. Test the Integration
1. After connecting, add a test domain (like `example.com`) to your blocked websites
2. Check the console logs for sync messages
3. Verify the domain appears in your NextDNS dashboard at [https://my.nextdns.io](https://my.nextdns.io)

### 5. Configure Your Devices
Once NextDNS is connected:
1. Follow the device setup instructions in your app
2. Configure your router, phone, or computer to use NextDNS
3. Test that blocked websites are actually blocked

## Troubleshooting

### "No NextDNS account configured" Error
- Make sure you completed steps 2-3 above
- Check that your API key is exactly 40 characters
- Verify your Profile ID is correct

### Domains Not Syncing
1. Check browser console for error messages
2. Click "Sync Now" button in the NextDNS section
3. Look at the Sync History for failed operations

### API Key Issues
- Make sure the API key has full permissions
- Regenerate the API key if needed
- Check that you copied the entire 40-character string

## How It Works
1. You add domains to the Dopamine Detox app (stored in Supabase)
2. The app automatically syncs with NextDNS using their API
3. NextDNS blocks the domains at the DNS level across all your devices
4. This provides network-wide blocking that works everywhere

## Support
If you're still having issues:
1. Check the browser console for detailed error messages
2. Look at the Sync History in your NextDNS Integration section
3. Verify your NextDNS account is active and has the correct permissions