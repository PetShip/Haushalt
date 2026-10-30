import CloudKit
import SwiftUI
import UIKit

final class AppDelegate: NSObject, UIApplicationDelegate, ObservableObject {
    static weak var shared: AppDelegate?
    @Published var invitation: CKShare.Metadata?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        Self.shared = self
        return true
    }
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        let configuration = UISceneConfiguration(name: nil, sessionRole: connectingSceneSession.role)
        configuration.delegateClass = SharingSceneDelegate.self
        if let metadata = options.cloudKitShareMetadata { invitation = metadata }
        return configuration
    }
    func application(_ application: UIApplication, userDidAcceptCloudKitShareWith cloudKitShareMetadata: CKShare.Metadata) {
        invitation = cloudKitShareMetadata
    }
}

final class SharingSceneDelegate: NSObject, UIWindowSceneDelegate {
    func windowScene(_ windowScene: UIWindowScene, userDidAcceptCloudKitShareWith cloudKitShareMetadata: CKShare.Metadata) {
        AppDelegate.shared?.invitation = cloudKitShareMetadata
    }
}

@main
@MainActor
struct HouseholdApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var delegate
    @StateObject private var store = HouseholdStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .tint(.teal)
                .task { await store.refresh() }
                .task(id: scenePhase) {
                    guard scenePhase == .active else { return }
                    while !Task.isCancelled {
                        do { try await Task.sleep(for: .seconds(30)) } catch { return }
                        guard !Task.isCancelled else { return }
                        await store.refresh()
                    }
                }
                .onReceive(delegate.$invitation.compactMap { $0 }) { invitation in
                    Task { await store.accept(invitation) }
                }
                .onReceive(NotificationCenter.default.publisher(for: .CKAccountChanged)) { _ in
                    store.clearForAccountChange()
                    Task { await store.refresh() }
                }
                .onChange(of: scenePhase) { _, phase in
                    if phase == .active { Task { await store.refresh() } }
                }
                .alert("Hinweis", isPresented: Binding(get: { store.error != nil }, set: { if !$0 { store.error = nil } })) {
                    Button("OK", role: .cancel) { store.error = nil }
                } message: { Text(store.error ?? "") }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var store: HouseholdStore

    var body: some View {
        Group {
            if store.selected != nil {
                TabView {
                    WeeklyView().tabItem { Label("Hausarbeit", systemImage: "checkmark.seal") }
                    TasksView().tabItem { Label("Aufgaben", systemImage: "checklist") }
                    FamilyView().tabItem { Label("Familie", systemImage: "person.2") }
                    SettingsView().tabItem { Label("Einstellungen", systemImage: "gearshape") }
                }
            } else {
                OnboardingView()
            }
        }
        .overlay(alignment: .top) {
            if store.busy { ProgressView().padding(10).background(.regularMaterial, in: Capsule()).accessibilityLabel("iCloud wird synchronisiert") }
        }
    }
}

struct OnboardingView: View {
    @EnvironmentObject private var store: HouseholdStore
    @State private var name = ""
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Image(systemName: "house.and.flag.fill").font(.system(size: 56)).foregroundStyle(.teal).frame(maxWidth: .infinity).padding()
                    Text("Gemeinsam wird's leichter.").font(.largeTitle.bold())
                    Text("Hausarbeit verteilen, Wochen abhaken und Taschengeld im Blick behalten – in eurem privaten Haushalt.")
                }
                Section("Euren Haushalt starten") {
                    TextField("Name des Haushalts", text: $name).textInputAutocapitalization(.words)
                    Button("Privaten Haushalt erstellen") { Task { await store.create(name: name) } }
                        .disabled(store.busy || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || name.count > 80)
                }
                Section("Schon eingeladen?") {
                    Text("Öffne die persönliche iCloud-Einladung, die du von deiner Familie erhalten hast. Du brauchst dafür einen iCloud-Account.")
                    Button("iCloud erneut prüfen") { Task { await store.refresh() } }.disabled(store.busy)
                }
                Section {
                    Text("Keine vorgegebenen Familienmitglieder. Keine Werbung, kein Tracking. Verwende auf Wunsch Spitznamen. Daten werden im privaten iCloud-Bereich des Eigentümers gespeichert und nur mit eingeladenen Personen geteilt.")
                    NavigationLink("Datenschutz", destination: PrivacyView())
                }
            }
            .navigationTitle("Haushalt")
        }
    }
}
