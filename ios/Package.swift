// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "HouseholdCore",
    platforms: [.macOS(.v13), .iOS(.v17)],
    products: [.library(name: "HouseholdCore", targets: ["HouseholdCore"])],
    targets: [
        .target(name: "HouseholdCore", path: "Household", exclude: [
            "HouseholdApp.swift", "CloudHouseholdService.swift", "HouseholdStore.swift",
            "WeeklyView.swift", "FamilyAndTasksViews.swift", "SettingsView.swift",
            "Info.plist", "Household.entitlements", "PrivacyInfo.xcprivacy", "Assets.xcassets"
        ], sources: ["Models.swift"]),
        .testTarget(name: "HouseholdCoreTests", dependencies: ["HouseholdCore"], path: "Tests")
    ]
)
