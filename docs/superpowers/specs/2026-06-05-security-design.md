# Security & Encryption — Design Spec

**Date:** 2026-06-05
**Feature:** #13 Security & Encryption
**Status:** Approved for implementation

---

## Goal

Ensure users' private notes and thoughts are protected at rest on-device. This is a baseline security feature for all users, not a premium feature. App lock (biometric/passcode gate) is deferred as a separate premium feature.

## Threat Model

- **In scope:** Files accessible to an attacker with physical access to a locked device (e.g. device theft, forensic extraction of app sandbox)
- **Out of scope:** Unlocked device access (addressed by future app lock feature), jailbroken device with active screen unlock, server-side data (app is local-only)

## Approach

iOS Data Protection (`NSFileProtectionComplete`) — OS-managed file encryption tied to the device passcode. Files are encrypted whenever the device screen is locked. This is the standard approach used by banking, health, and messaging apps on iOS.

Chosen over app-layer field encryption (high complexity, marginal real-world gain) and SQLCipher (requires ejecting Expo managed workflow).

---

## Changes

### 1. iOS Data Protection Entitlement (`app.json`)

Add to the `ios` section:

```json
"entitlements": {
  "com.apple.developer.default-data-protection": "NSFileProtectionComplete"
}
```

**Effect:** All files created by the app — SQLite database (`borednotes.db`), photos (`bn_media/`), temporary CSV exports (cache dir) — are encrypted by iOS whenever the device is locked. Files are decrypted transparently when the user unlocks the device.

**Current default:** `NSFileProtectionCompleteUntilFirstUserAuthentication` — files remain accessible after the device has been unlocked once since boot, even while subsequently locked. The new setting is stricter.

**Prerequisite:** User must have a device passcode set. Approximately 98% of iPhone users do. Users without a passcode get no additional protection, but this is true of all iOS apps and cannot be improved at the app layer without a user-facing passcode feature.

**`ITSAppUsesNonExemptEncryption`** stays `false` — iOS Data Protection is OS-provided and excluded from App Store export compliance requirements.

### 2. AI Privacy Disclosure (`app/settings.tsx`)

Add a disclosure line in the Settings screen under the Notes/AI section:

> "AI-generated prompts use short snippets from your recent notes for context. Enable offline mode to disable this."

**Background:** `src/prompts/next.ts` sends the first 40 characters of up to 3 recent note responses, plus location label + weather, to the Anthropic API when generating contextual prompts. No user identifier is included (the app has no accounts), but the content is unattributed rather than truly anonymous. Offline mode (`offline_mode` setting) already disables all AI calls; users need to know this opt-out exists.

**Wording note:** Do not use the word "anonymous" — the data is unattributed but could be quasi-identifying via note content + location combination.

---

## Out of Scope

| Item | Reason |
|------|--------|
| App lock / biometric gate | Deferred as premium feature |
| App-layer field encryption | High complexity, marginal gain over iOS Data Protection for real-world threat model |
| SQLCipher | Requires ejecting Expo managed workflow |
| API key proxy server | Significant infrastructure; `EXPO_PUBLIC_ANTHROPIC_API_KEY` exposure is a known limitation of the current architecture |

---

## Known Limitation

`EXPO_PUBLIC_ANTHROPIC_API_KEY` is baked into the compiled JS bundle at build time. Someone who decompiles the `.ipa` can extract it. Fixing this requires a backend proxy. Documented here for awareness; not addressed in this feature.

---

## Testing

- Verify `com.apple.developer.default-data-protection` entitlement appears in the EAS build's `.entitlements` file after build
- Manual: confirm app opens and data loads normally after device lock/unlock cycle (regression check — entitlement should not affect normal app behaviour)
- Review: confirm AI disclosure text appears in Settings and offline mode toggle is adjacent or clearly associated

No automated tests required — the entitlement is build configuration, not logic.
