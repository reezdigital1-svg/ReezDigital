# Nico Mail Agent APK v1.0

Signed APK: `dist/NicoMailAgent.apk` (package `com.nico.mailagent`, minSdk 24, targetSdk 34).

## What it does
- **Reads mail**: native IMAP over SSL (io-built client, `Imap.java`), default imap.gmail.com:993, any provider's host works (Yahoo, Outlook, custom).
- **Composes + replies**: unseen mail listed as cards; WRITE AI REPLY drafts a response using your ROLE text as the AI system instruction (openrouter :free or Mistral, `Ai.java`); honest template fallback with no key, labelled as template.
- **Auto-reply**: AUTO-REPLY toggle checks every 5 minutes while the app is open, replies to up to 10 unseen messages per run, marks them read.
- **Sends over SMTP**: SSL port 465 (`Smtp.java`), UTF-8 bodies, RFC 2047 base64 subjects, dot-stuffing.
- **Leads** (`Leads.java`): fingerprints Shopify (cdn.shopify.com / products.json) and WooCommerce (wp-json store API), reads the public product feed, scrapes contact emails from home + contact/about pages with polite 350ms pacing; desktop-JVM tested against live stores (Allbirds: Shopify confirmed, 674 products, help@allbirds.com).
- **ROLE tab**: paste any persona/system prompt; saved locally and attached to every draft and auto-reply.

## Gmail setup for the user
1. Turn on 2-Step Verification.
2. Google Account > Security > App passwords > create one.
3. Paste that 16-character app password in SETUP (normal password fails IMAP by design).

## Build locally
Same chain as `android/` (JDK 17 + build-tools r34 + platform 34), sources in this folder; no assets, sign with your own keystore.

## Honest limits
- No app can post inside another app or run forever in Android's background; auto-reply works while the app is open (a foreground-service release can loosen that later).
- Bulk cold email gets Gmail rate-limited/suspended; use small personal batches, respect the ~500/day cap, and only mail people who plausibly want to hear from you.
- Credentials stay in app-private SharedPreferences on the phone; nothing is transmitted except to your own mail server and your chosen AI provider.
