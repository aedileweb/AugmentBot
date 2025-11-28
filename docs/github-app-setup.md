# GitHub App Setup Guide

This guide walks through creating and configuring the GitHub App for AugmentBot.

## Step 1: Create GitHub App

1. Go to your GitHub organization settings
2. Navigate to **Developer settings** → **GitHub Apps**
3. Click **New GitHub App**

## Step 2: Basic Information

Fill in the following details:

- **GitHub App name**: `AugmentBot` (or your preferred name)
- **Description**: `Universal GitHub Code Assistant with AI-powered fix application`
- **Homepage URL**: `https://your-domain.com` (your organization website)
- **Webhook URL**: `https://your-bot-domain.com/webhook/github`
- **Webhook secret**: Generate a secure random string

## Step 3: Permissions

Configure the following permissions:

### Repository Permissions
- **Contents**: Read & Write (to read code and apply fixes)
- **Issues**: Write (to comment on PRs)
- **Metadata**: Read (to access repository information)
- **Pull requests**: Write (to comment and request reviews)

### Organization Permissions
- **Members**: Read (to identify organization members)

## Step 4: Subscribe to Events

Enable the following webhook events:

- [x] **Issue comment** (for @augment mentions in PR comments)
- [x] **Pull request** (for PR state changes)
- [x] **Pull request review** (for review submissions)
- [x] **Pull request review comment** (for inline review comments)

## Step 5: Installation Settings

- **Where can this GitHub App be installed?**: 
  - Select "Only on this account" for private use
  - Select "Any account" if you plan to distribute the app

## Step 6: Generate Private Key

1. After creating the app, scroll down to **Private keys**
2. Click **Generate a private key**
3. Download the `.pem` file
4. Store it securely - you'll need it for authentication

## Step 7: Install the App

1. Go to the **Install App** tab
2. Click **Install** next to your organization
3. Choose **All repositories** or select specific repositories
4. Complete the installation

## Step 8: Get Installation ID

After installation, note the Installation ID from the URL:
`https://github.com/settings/installations/12345678`

The number at the end (12345678) is your Installation ID.

## Step 9: Environment Configuration

Create your `.env` file with the following values:

```bash
# From the GitHub App settings page
GITHUB_APP_ID=123456

# Content of the downloaded .pem file
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
YOUR_PRIVATE_KEY_CONTENT_HERE
-----END RSA PRIVATE KEY-----"

# The webhook secret you generated
GITHUB_WEBHOOK_SECRET=your-webhook-secret

# Your installation ID
GITHUB_INSTALLATION_ID=12345678
```

## Step 10: Test the Setup

1. Start your webhook server locally with ngrok:
   ```bash
   ngrok http 3000
   ```

2. Update your GitHub App webhook URL to the ngrok URL:
   `https://abc123.ngrok.io/webhook/github`

3. Create a test PR and comment `@augment help`

4. Check your server logs for incoming webhooks

## Security Best Practices

### Private Key Security
- Never commit the private key to version control
- Use environment variables or secure secret management
- Rotate the key periodically (generate new key, update app)

### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook URLs
- Keep webhook secrets secure and rotate them

### Permissions
- Use least-privilege principle
- Regularly audit app permissions
- Remove unused permissions

## Troubleshooting

### Common Issues

#### "Bad credentials" error
- Check that your private key is correctly formatted
- Ensure no extra spaces or characters in the key
- Verify the App ID matches your GitHub App

#### Webhook not receiving events
- Check that the webhook URL is accessible from the internet
- Verify the webhook secret matches your configuration
- Ensure the app is installed on the target repositories

#### Permission denied errors
- Verify the app has the required permissions
- Check that the installation includes the target repositories
- Ensure the app is not suspended or restricted

### Testing Commands

```bash
# Test webhook reception
curl -X POST http://localhost:3000/webhook/github \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Test GitHub API authentication
node scripts/test-github-auth.js

# Test Augment API integration
node scripts/test-augment-api.js
```

## Next Steps

1. **Deploy to production**: Set up hosting and update webhook URL
2. **Install on repositories**: Add to all target repositories
3. **Test with real PRs**: Create test PRs and verify functionality
4. **Monitor and optimize**: Set up logging and monitoring

For more information, see:
- [GitHub Apps Documentation](https://docs.github.com/en/developers/apps)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Webhook Events Reference](https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads)