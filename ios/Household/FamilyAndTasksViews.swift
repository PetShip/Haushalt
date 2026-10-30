import SwiftUI

struct FamilyView: View {
    @EnvironmentObject private var store: HouseholdStore
    @State private var nickname = ""
    @State private var joinedOn = Date()
    @State private var memberToDelete: HouseholdMember?
    var body: some View {
        NavigationStack {
            Form {
                Section("Familienmitglieder") {
                    ForEach(store.household?.members.filter { !$0.archived } ?? []) { member in
                        HStack {
                            Label(member.nickname, systemImage: "person.crop.circle")
                            Spacer()
                            Button("Archivieren", role: .destructive) {
                                Task { await store.update { household in
                                    if let index = household.members.firstIndex(where: { $0.id == member.id }) { household.members[index].archived = true }
                                } }
                            }.disabled(!store.canWrite)
                        }
                        .swipeActions {
                            Button("Profil löschen", role: .destructive) { memberToDelete = member }.disabled(!store.canWrite)
                        }
                    }
                }
                Section("Mitglied hinzufügen") {
                    TextField("Spitzname", text: $nickname).textInputAutocapitalization(.words)
                    DatePicker("Dabei seit", selection: $joinedOn, in: ...Date(), displayedComponents: .date)
                    Button("Hinzufügen") {
                        let name = nickname.trimmingCharacters(in: .whitespacesAndNewlines)
                        Task {
                            await store.update { $0.members.append(HouseholdMember(nickname: name, joinedOn: joinedOn)) }
                            if store.error == nil { nickname = "" }
                        }
                    }.disabled(!store.canWrite || nickname.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || nickname.count > 40)
                }
                Section {
                    Text("Ein Spitzname reicht. Geburtstag, Adresse und Schule werden nicht benötigt. Ein Familienprofil ist kein eigener iCloud-Zugang.")
                    Text("Archivieren bewahrt den Verlauf. Über Einstellungen kannst du den Haushalt exportieren oder löschen.")
                }
                let archived = store.household?.members.filter { $0.archived } ?? []
                if !archived.isEmpty {
                    Section("Archiviert") {
                        ForEach(archived) { member in
                            Button("\(member.nickname) wiederherstellen") {
                                Task { await store.update { household in
                                    if let index = household.members.firstIndex(where: { $0.id == member.id }) { household.members[index].archived = false }
                                } }
                            }.disabled(!store.canWrite)
                            .swipeActions {
                                Button("Profil löschen", role: .destructive) { memberToDelete = member }.disabled(!store.canWrite)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Familie")
            .refreshable { await store.refresh() }
            .confirmationDialog("Familienprofil endgültig löschen?", isPresented: Binding(get: { memberToDelete != nil }, set: { if !$0 { memberToDelete = nil } }), titleVisibility: .visible) {
                Button("Profil und zugehörigen Verlauf löschen", role: .destructive) {
                    guard let member = memberToDelete else { return }
                    Task { await store.update { household in
                        household.members.removeAll { $0.id == member.id }
                        household.completions.removeAll { $0.memberID == member.id }
                        household.weeks.removeAll { $0.memberID == member.id }
                    } }
                    memberToDelete = nil
                }
            } message: { Text("Die Erledigungen und Wochenbestätigungen dieses Profils werden ebenfalls gelöscht. Exportierte Kopien bleiben erhalten.") }
        }
    }
}

struct TasksView: View {
    @EnvironmentObject private var store: HouseholdStore
    @State private var title = ""
    @State private var memberID: UUID?
    var body: some View {
        NavigationStack {
            List {
                if let household = store.household {
                    Section("Wer hat mitgeholfen?") {
                        Picker("Familienmitglied", selection: $memberID) {
                            Text("Bitte auswählen").tag(nil as UUID?)
                            ForEach(household.members.filter { !$0.archived }) { member in
                                Text(member.nickname).tag(Optional(member.id))
                            }
                        }
                    }
                    Section("Aufgaben") {
                        ForEach(household.tasks.filter { !$0.archived }) { task in
                            HStack {
                                VStack(alignment: .leading) {
                                    Text(task.title)
                                    Text("\(household.completions.filter { $0.taskID == task.id }.count) Mal erledigt").font(.caption).foregroundStyle(.secondary)
                                }
                                Spacer()
                                Button {
                                    guard let memberID, household.members.contains(where: { $0.id == memberID && !$0.archived }) else { return }
                                    Task { await store.update { $0.completions.append(TaskCompletion(memberID: memberID, taskID: task.id, date: Date())) } }
                                } label: { Image(systemName: "plus.circle.fill").font(.title2) }
                                .accessibilityLabel("\(task.title) als erledigt eintragen")
                                .disabled(!store.canWrite || memberID == nil)
                            }
                            .swipeActions {
                                Button("Archivieren", role: .destructive) {
                                    Task { await store.update { household in
                                        if let index = household.tasks.firstIndex(where: { $0.id == task.id }) { household.tasks[index].archived = true }
                                    } }
                                }.disabled(!store.canWrite)
                            }
                        }
                    }
                    Section("Neue Aufgabe") {
                        TextField("Zum Beispiel: Tisch decken", text: $title)
                        Button("Aufgabe hinzufügen") {
                            let name = title.trimmingCharacters(in: .whitespacesAndNewlines)
                            Task {
                                await store.update { $0.tasks.append(HouseholdTask(title: name)) }
                                if store.error == nil { title = "" }
                            }
                        }.disabled(!store.canWrite || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || title.count > 100)
                    }
                    Section("Letzte Beiträge") {
                        ForEach(Array(household.completions.sorted { $0.date > $1.date }.prefix(30))) { entry in
                            VStack(alignment: .leading) {
                                Text("\(household.members.first { $0.id == entry.memberID }?.nickname ?? "Mitglied") · \(household.tasks.first { $0.id == entry.taskID }?.title ?? "Aufgabe")")
                                Text(entry.date, style: .date).font(.caption).foregroundStyle(.secondary)
                            }
                            .swipeActions {
                                Button("Entfernen", role: .destructive) { Task { await store.update { $0.completions.removeAll { $0.id == entry.id } } } }.disabled(!store.canWrite)
                            }
                        }
                    }
                    let archived = household.tasks.filter { $0.archived }
                    if !archived.isEmpty {
                        Section("Archivierte Aufgaben") {
                            ForEach(archived) { task in
                                Button("\(task.title) wiederherstellen") {
                                    Task { await store.update { household in
                                        if let index = household.tasks.firstIndex(where: { $0.id == task.id }) { household.tasks[index].archived = false }
                                    } }
                                }.disabled(!store.canWrite)
                            }
                        }
                    }
                }
            }.navigationTitle("Aufgaben").refreshable { await store.refresh() }
        }
    }
}
