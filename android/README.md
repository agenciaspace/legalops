# legalops.club Android app

This project packages the existing Club PWA as a Trusted Web Activity (TWA).
Chrome remains the web runtime, so Supabase sessions, Google sign-in, uploads,
and service-worker behavior stay aligned with `https://legalops.club`.

## Release identity

- Application ID: `club.legalops.app`
- Start URL: `https://legalops.club/community`
- Signing key: kept outside Git at
  `~/.local/share/legalops-club/android-release.keystore`
- Digital Asset Links: `public/.well-known/assetlinks.json`

The signing key and its password are required for every future update. Never
replace the key for the same application ID, or Android will reject upgrades.

## Build

Install JDK 17 and Bubblewrap, then run from this directory:

```bash
npx @bubblewrap/cli update --skipVersionUpgrade
npx @bubblewrap/cli build
```

Bubblewrap creates a signed `app-release-signed.apk` and an Android App Bundle.
Before publishing through Google Play, add the Play App Signing certificate
fingerprint to `twa-manifest.json` and regenerate `assetlinks.json`.
