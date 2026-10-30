# Native iPhone app — public-family edition

Status: implementation prepared; not yet signed, device-tested or App Store-ready.
Local static checks pass. Uploading the source to the existing repository
PetShip/Haushalt on branch app-store-ios and running a macOS build was explicitly
approved by the user. Swift/Xcode results are tracked in the GitHub workflow.
The existing Next.js app and live family database are a separate product. Never
point this app at the web app, package its seed data, or ship its environment files.

## Implemented

- SwiftUI iPhone app, minimum iOS 17; no WebView and no third-party SDKs.
- Empty onboarding; families create their own households and nicknames.
- One private CloudKit custom zone per household; private CKShare invitations.
- Shared households appear in the invited user's shared CloudKit database.
- iCloud enforces read-only / read-write access. Every read-write participant can
  manage all household content, including pocket-money eligibility. There is no
  separate parent role; invite children read-only when confirmations must be protected.
- Native family profiles, archiving and permanent profile/history deletion.
- Task completion history, task archive/restore, ISO weeks and monthly eligibility.
- Required weeks begin at the profile's joining week. Monday owns the month.
  Week boundaries use Europe/Vienna consistently across devices.
- JSON export, owner household deletion, participant leave flow.
- Foreground refresh, pull-to-refresh, 30-second foreground polling.
- Optimistic concurrency: stale writes fail instead of overwriting another device.
  Refresh and repeat the change after a conflict. Changes require connectivity;
  there is no offline write queue or persistent device cache in this version.

## Project

Open `Household.xcodeproj` on macOS with Xcode. The project is checked in; Python
is only needed when regenerating it after adding source files:

```sh
python3 tools/generate_project.py
python3 tools/check_public_boundary.py
swift test
xcodebuild -project Household.xcodeproj -scheme Household \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

`../.github/workflows/ios-check.yml` runs the unsigned build and calendar/model
tests on macOS. An unsigned build verifies compilation, not iCloud behavior,
Apple signing, or App Store acceptance. It does not upload anything to Apple.

## Apple account configuration — required before device testing

1. Register a unique explicit bundle identifier in your Apple Developer team;
   enable iCloud / CloudKit and associate a new container for the public app.
2. Replace `com.REPLACE.household`, `iCloud.com.REPLACE.household` and the blank
   team ID in `Config.xcconfig`. These are identifiers, not credentials.
3. In Xcode, select the registered team and confirm iCloud/CloudKit capability
   and automatic provisioning. The container identifier must match Info.plist
   and the entitlement exactly.
4. Run on an iPhone signed into iCloud. Create a household to establish the
   `Household` record type and `payload` (Bytes) schema in Development.
5. Run the two-account checks in `RELEASE.md`. Deploy the tested CloudKit schema
   to Production before TestFlight; TestFlight uses the production environment.
6. Review the included app icon and complete support/privacy URLs and App Store metadata.
7. Archive the Release scheme on a suitable macOS/Xcode version, validate in
   Organizer, and upload to App Store Connect / TestFlight using your account.

Do not add certificates, signing passwords, App Store private keys or provisioning
profiles to Git. Signing credentials are deliberately absent from this repository.

## Data boundary and privacy

The app target includes only Swift sources, its Info.plist, entitlements and privacy
manifest from `Household/`. It has no access path to the original app's PostgreSQL
database, global PIN, login/IP history or personal sleeping arrangements.

This is data separation and minimization, not a promise that user-entered data is
anonymous. A nickname can identify a person. CloudKit uses the user's Apple account;
invited participants can see the content they are authorized to access. No public
CloudKit database, advertising, analytics, contact access or location access is used.
The developer's Apple team still administers the CloudKit container; do not promise
that cloud storage is technically inaccessible to the operator.

The privacy manifest conservatively declares names and other user content linked
to identity for app functionality, with no tracking. Check the final App Store
privacy answers against actual production behavior and Apple's current definitions.
The included policy draft is not publishable until operator/contact details are filled.

Official references:
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/documentation/cloudkit/ckshare
- https://developer.apple.com/documentation/coredata/accepting-share-invitations-in-a-swiftui-app
- https://developer.apple.com/documentation/bundleresources/privacy-manifest-files
