import CloudKit
import SwiftUI
import UniformTypeIdentifiers
import UIKit

struct HouseholdDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var data: Data
    init(data: Data) { self.data = data }
    init(configuration: ReadConfiguration) throws { data = configuration.file.regularFileContents ?? Data() }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: data) }
}

struct SharePresentation: Identifiable {
    let id = UUID()
    let share: CKShare
    let container: CKContainer
}

struct SettingsView: View {
    @EnvironmentObject private var store: HouseholdStore
    @State private var share: SharePresentation?
    @State private var preparingShare = false
    @State private var deleting = false
    @State private var exporting = false
    @State private var exportDocument = HouseholdDocument(data: Data())
    @State private var newName = ""
    var body: some View {
        NavigationStack {
            Form {
                Section("Haushalt") {
                    Picker("Aktiver Haushalt", selection: $store.selectedID) {
                        ForEach(store.households) { household in
                            Text(household.household.name).tag(Optional(household.id))
                        }
                    }.disabled(store.busy || preparingShare)
                    Text(store.selected?.canWrite == true ? "Du kannst diesen Haushalt bearbeiten." : "Du hast Lesezugriff auf diesen Haushalt.")
                    if let date = store.lastSynced { LabeledContent("Zuletzt aktualisiert", value: date.formatted(date: .omitted, time: .shortened)) }
                    Button("Jetzt synchronisieren") { Task { await store.refresh() } }.disabled(store.busy || preparingShare)
                }
                if store.selected?.isOwner == true {
                    Section("Familie einladen") {
                        Text("Nur persönlich eingeladene iCloud-Nutzer erhalten Zugriff. Personen mit Schreibzugriff können alle Einträge und Wochenbestätigungen bearbeiten. Gib Kindern bei Bedarf nur Lesezugriff.")
                        Button("Einladen und Zugriffe verwalten") {
                            guard let selected = store.selected, let container = store.cloud.container else { return }
                            preparingShare = true
                            Task {
                                defer { preparingShare = false }
                                do { share = SharePresentation(share: try await store.cloud.share(selected), container: container) }
                                catch { store.error = "Die Einladung konnte nicht vorbereitet werden. Bitte synchronisiere den Haushalt und versuche es erneut." }
                            }
                        }.disabled(store.busy || preparingShare)
                    }
                }
                Section("Weiterer Haushalt") {
                    TextField("Name", text: $newName)
                    Button("Privaten Haushalt erstellen") {
                        Task { await store.create(name: newName); if store.error == nil { newName = "" } }
                    }.disabled(store.busy || preparingShare || newName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || newName.count > 80)
                }
                Section("Deine Daten") {
                    Button("Haushalt als JSON exportieren") {
                        guard let household = store.household else { return }
                        do {
                            let encoder = JSONEncoder()
                            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
                            exportDocument = HouseholdDocument(data: try encoder.encode(household))
                            exporting = true
                        } catch { store.error = "Der Export konnte nicht erstellt werden." }
                    }.disabled(store.busy)
                    Text("Ein Export enthält eure privaten Einträge. Teile ihn nur mit vertrauenswürdigen Personen.").font(.caption)
                    Button(store.selected?.isOwner == true ? "Haushalt endgültig löschen" : "Geteilten Haushalt verlassen", role: .destructive) { deleting = true }.disabled(store.busy || preparingShare)
                    NavigationLink("Datenschutz", destination: PrivacyView())
                }
                Section("Support") {
                    if let email = Bundle.main.object(forInfoDictionaryKey: "SupportEmail") as? String,
                       let url = URL(string: "mailto:\(email)") {
                        Link(email, destination: url)
                    }
                }
            }
            .navigationTitle("Einstellungen")
            .confirmationDialog(store.selected?.isOwner == true ? "Haushalt für alle löschen?" : "Haushalt verlassen?", isPresented: $deleting, titleVisibility: .visible) {
                Button(store.selected?.isOwner == true ? "Endgültig löschen" : "Verlassen", role: .destructive) { Task { await store.removeSelected() } }
            } message: {
                Text(store.selected?.isOwner == true ? "Alle Familienprofile, Aufgaben und Bestätigungen dieses Haushalts werden aus iCloud entfernt. Das lässt sich nicht rückgängig machen. Bereits exportierte Kopien werden nicht gelöscht." : "Dein Zugriff wird entfernt. Die Daten des Eigentümers bleiben erhalten.")
            }
            .sheet(item: $share, onDismiss: { Task { await store.refresh() } }) { presentation in
                CloudSharingView(share: presentation.share, container: presentation.container) { message in store.error = message }
            }
            .fileExporter(isPresented: $exporting, document: exportDocument, contentType: .json, defaultFilename: "Haushalt-Export") { result in
                if case .failure = result { store.error = "Die Exportdatei konnte nicht gespeichert werden." }
            }
        }
    }
}

struct CloudSharingView: UIViewControllerRepresentable {
    let share: CKShare
    let container: CKContainer
    let onError: (String) -> Void
    func makeUIViewController(context: Context) -> UICloudSharingController {
        let controller = UICloudSharingController(share: share, container: container)
        controller.availablePermissions = [.allowPrivate, .allowReadOnly, .allowReadWrite]
        controller.delegate = context.coordinator
        return controller
    }
    func updateUIViewController(_ uiViewController: UICloudSharingController, context: Context) {}
    func makeCoordinator() -> Coordinator { Coordinator(onError: onError) }
    final class Coordinator: NSObject, UICloudSharingControllerDelegate {
        let onError: (String) -> Void
        init(onError: @escaping (String) -> Void) { self.onError = onError }
        func itemTitle(for csc: UICloudSharingController) -> String? { "Privater Haushalt" }
        func cloudSharingController(_ csc: UICloudSharingController, failedToSaveShareWithError error: Error) {
            onError("Die Freigabe konnte nicht gespeichert werden. Bitte versuche es erneut.")
        }
    }
}

struct PrivacyView: View {
    var body: some View {
        List {
            Section("Privater Haushalt") {
                Text("Die App speichert Spitznamen, Aufgaben, Erledigungen und Wochenbestätigungen in Apple iCloud (CloudKit). Der Eigentümer entscheidet, welche Personen eingeladen werden und ob sie lesen oder auch schreiben dürfen.")
                Text("Es gibt keine öffentliche Haushaltsliste und keine Verbindung zur privaten Datenbank der ursprünglichen Familien-Web-App. Die App enthält keine voreingetragenen Familienmitglieder, keine Werbung und keine Analyse-SDKs.")
            }
            Section("Datensparsamkeit") {
                Text("Nutze Spitznamen. Die App fragt keine Geburtstage, Schule, Adresse, Kontakte, Kamera oder Standort ab. Ein Spitzname macht Daten nicht automatisch anonym. Eingeladene Personen können die geteilten Daten sehen.")
                Text("iCloud verarbeitet Account- und Betriebsdaten nach Apples Bedingungen. Die App legt keinen eigenen Login-Account an. Die iCloud-Anmeldung wird von iOS verwaltet.")
            }
            Section("Löschen und Exportieren") {
                Text("Der Eigentümer kann den gesamten Haushalt einschließlich Freigabe in den Einstellungen löschen. Eingeladene Personen können den Haushalt verlassen. Exporte liegen außerhalb der App und müssen separat gelöscht werden.")
                Text("Familienprofile sind Einträge innerhalb eines Haushalts. Archivieren erhält deren Verlauf und ist keine Löschung.")
                Text("Wische ein Familienprofil nach links, um es mit seinen Erledigungen und Wochenbestätigungen endgültig zu löschen.")
            }
            Section("Verbindung und Berechtigungen") {
                Text("Für Laden und Speichern ist eine Internetverbindung nötig. Die aktuelle Ansicht bleibt während einer geöffneten Sitzung im Arbeitsspeicher. Änderungen werden erst nach Bestätigung durch iCloud angezeigt. Ziehe eine Liste nach unten, um andere Geräteänderungen zu laden.")
            }
        }
        .navigationTitle("Datenschutz")
    }
}
