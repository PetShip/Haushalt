import CloudKit
import SwiftUI

@MainActor
final class HouseholdStore: ObservableObject {
    @Published private(set) var households: [CloudHousehold] = []
    @Published var selectedID: String?
    @Published private(set) var busy = false
    @Published private(set) var loaded = false
    @Published var error: String?
    @Published private(set) var lastSynced: Date?
    let cloud = CloudHouseholdService()
    private var generation = 0
    private var pendingInvitation: CKShare.Metadata?

    private func finish(_ requestGeneration: Int) {
        guard generation == requestGeneration else { return }
        busy = false
        if let invitation = pendingInvitation {
            pendingInvitation = nil
            Task { await accept(invitation) }
        }
    }

    var selected: CloudHousehold? { households.first { $0.id == selectedID } }
    var household: Household? { selected?.household }
    var canWrite: Bool { selected?.canWrite == true && !busy }

    func refresh() async {
        guard !busy else { return }
        let requestGeneration = generation
        busy = true
        defer { finish(requestGeneration) }
        do {
            let fetched = try await cloud.fetchAll()
            guard generation == requestGeneration else { return }
            households = fetched
            if !households.contains(where: { $0.id == selectedID }) { selectedID = households.first?.id }
            loaded = true
            lastSynced = Date()
        } catch {
            guard generation == requestGeneration else { return }
            // Remove stale data if an invitation was revoked or iCloud is unavailable.
            households = []
            selectedID = nil
            self.error = message(error)
        }
    }

    func create(name: String) async {
        let name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !busy, !name.isEmpty, name.count <= 80 else { return }
        let requestGeneration = generation
        busy = true
        defer { finish(requestGeneration) }
        do {
            let remote = try await cloud.create(name: name)
            guard generation == requestGeneration else { return }
            households.append(remote)
            selectedID = remote.id
            loaded = true
            lastSynced = Date()
        } catch { if generation == requestGeneration { self.error = message(error) } }
    }

    func update(_ change: (inout Household) -> Void) async {
        guard canWrite, let selected else { return }
        let requestGeneration = generation
        busy = true
        defer { finish(requestGeneration) }
        var next = selected.household
        change(&next)
        do {
            let saved = try await cloud.save(next, replacing: selected)
            // Account changes can occur while an operation is suspended.
            guard generation == requestGeneration, selectedID == selected.id else { return }
            if let index = households.firstIndex(where: { $0.id == selected.id }) { households[index] = saved }
            lastSynced = Date()
        } catch { if generation == requestGeneration { self.error = message(error) } }
    }

    func confirm(memberID: UUID, week: ChoreWeek, completed: Bool) async {
        guard week.start <= Date(), let member = household?.members.first(where: { $0.id == memberID }),
              !member.archived, week.start >= ChoreCalendar.calendar.dateInterval(of: .weekOfYear, for: member.joinedOn)!.start else { return }
        await update { household in
            household.weeks.removeAll { $0.memberID == memberID && $0.monday == week.monday }
            household.weeks.append(WeekConfirmation(memberID: memberID, monday: week.monday, completed: completed))
        }
    }

    func accept(_ metadata: CKShare.Metadata) async {
        guard !busy else { pendingInvitation = metadata; return }
        let requestGeneration = generation
        busy = true
        do { try await cloud.accept(metadata) }
        catch { if generation == requestGeneration { self.error = message(error) } }
        guard generation == requestGeneration else { return }
        finish(requestGeneration)
        await refresh()
    }

    func removeSelected() async {
        guard !busy, let selected else { return }
        let requestGeneration = generation
        busy = true
        defer { finish(requestGeneration) }
        do {
            try await cloud.remove(selected)
            guard generation == requestGeneration else { return }
            households.removeAll { $0.id == selected.id }
            selectedID = households.first?.id
        } catch { if generation == requestGeneration { self.error = message(error) } }
    }

    func clearForAccountChange() {
        generation += 1
        pendingInvitation = nil
        busy = false
        error = nil
        households = []
        selectedID = nil
        loaded = false
        lastSynced = nil
    }

    private func message(_ error: Error) -> String {
        if error is HouseholdError { return error.localizedDescription }
        // Do not surface CloudKit record IDs, household payloads or server logs.
        return "iCloud ist gerade nicht erreichbar oder der Zugriff wurde geändert. Bitte prüfe deine Verbindung und aktualisiere die Ansicht."
    }
}
