# Release verification and remaining gates

## Automated verification

- Run `python3 ios/tools/check_public_boundary.py` from the repository root.
- Run `swift test` in `ios/`: October/November boundaries, ISO year, joining week,
  incomplete confirmation sets, Sunday cutoff and empty data roundtrip.
- Build the iPhone simulator target in Xcode / the macOS GitHub workflow.
- Run Xcode Analyze and review warnings before archiving.

## Mandatory signed-device checks (not performed on this Windows machine)

Use synthetic nicknames, never real family data, in a dedicated CloudKit test household.

1. Fresh install: no household data; missing iCloud shows an actionable message.
2. Account A creates a household and two profiles; account B cannot discover it.
3. A invites B read-only. Accept while the app is terminated and while it is open.
4. B sees only the invited household. B's edits must fail at the CloudKit permission
   layer as well as being disabled in the UI.
5. Grant B write access. Add a task on A, refresh B, record a completion on B, refresh A.
6. Simultaneous writes: the second stale save shows a conflict; refresh preserves
   the first save. No silent overwrite and no optimistic success after failure.
7. Revoke B. Refresh B: the household disappears. Switch Apple accounts: old
   household content is cleared immediately and cannot be restored by an old request.
8. Interrupt the network during create/save/share/delete: no false success.
9. Test current/future weeks, October's week ending in November, New Year and DST.
10. Profile deletion removes its history only. Archiving retains it. Task archive
    hides active actions; restore works. Export includes the current household only.
11. Owner deletion removes the zone/share; verify from B after refresh.
    Participant leave removes only that participant's access and preserves A's data.
12. Check VoiceOver, large Dynamic Type, dark mode, rotation and small iPhones.
13. Inspect the archived app's privacy report, entitlements, network traffic and
    resources. No private web assets, credentials, logs or original family data.
14. Repeat invitation, permission, deletion and schema tests in the CloudKit
    Production environment with TestFlight and distinct Apple accounts.

## Required release inputs

- Final app name, unique bundle ID, Apple Team ID and registered CloudKit container.
- Review the included 1024px app icon; device screenshots containing synthetic data only.
- Operator's legal identity, support email and working public support/privacy URLs.
- Verified privacy policy and App Store privacy disclosures; accurate age rating
  and distribution/category selection. Intended users: families, with parent-managed
  profiles. Do not claim Kids Category compliance without reviewing that scope.
- App Store Connect app entry, review contact and clear review instructions for
  iCloud onboarding/sharing. No real household or production family credentials.
- Signed archive produced with Xcode 26+ / iOS 26 SDK+ (Apple's current minimum
  since April 28, 2026); recheck requirements on the actual submission date.

No submission, account purchase or paid build service has been initiated.
