import CloudKit
import Foundation

enum HouseholdError: LocalizedError {
    case configuration, signInRequired, invalidData, readOnly, tooLarge, conflict

    var errorDescription: String? {
        switch self {
        case .configuration: return "Die iCloud-Konfiguration fehlt. Bitte wende dich an den App-Support."
        case .signInRequired: return "Bitte melde dich in den iPhone-Einstellungen bei iCloud an und aktiviere iCloud für diese App."
        case .invalidData: return "Dieser Haushalt kann mit dieser App-Version nicht geöffnet werden."
        case .readOnly: return "Du hast Lesezugriff. Änderungen sind nur mit Schreibzugriff möglich."
        case .tooLarge: return "Der Haushalt ist zu groß zum Speichern. Bitte exportiere den Verlauf und wende dich an den Support."
        case .conflict: return "Der Haushalt wurde inzwischen auf einem anderen Gerät geändert. Bitte aktualisiere ihn und wiederhole deine Änderung."
        }
    }
}

struct CloudHousehold: Identifiable {
    var id: String { "\(scope.rawValue):\(record.recordID.zoneID.ownerName):\(record.recordID.zoneID.zoneName):\(record.recordID.recordName)" }
    let record: CKRecord
    let scope: CKDatabase.Scope
    let household: Household
    let canWrite: Bool
    var isOwner: Bool { scope == .private }
}

@MainActor
final class CloudHouseholdService {
    private(set) var container: CKContainer?

    init() {
        if let id = Bundle.main.object(forInfoDictionaryKey: "CloudKitContainerIdentifier") as? String,
           !id.contains("REPLACE"), !id.isEmpty {
            container = CKContainer(identifier: id)
        }
    }

    func checkAccount() async throws {
        guard let container else { throw HouseholdError.configuration }
        guard try await container.accountStatus() == .available else { throw HouseholdError.signInRequired }
    }

    private func decode(_ record: CKRecord, scope: CKDatabase.Scope, canWrite: Bool) throws -> CloudHousehold {
        guard let payload = record["payload"] as? Data else { throw HouseholdError.invalidData }
        let household = try JSONDecoder().decode(Household.self, from: payload)
        guard household.version == 1 else { throw HouseholdError.invalidData }
        return CloudHousehold(record: record, scope: scope, household: household, canWrite: canWrite)
    }

    func fetchAll() async throws -> [CloudHousehold] {
        try await checkAccount()
        guard let container else { throw HouseholdError.configuration }
        var households: [CloudHousehold] = []
        for scope in [CKDatabase.Scope.private, .shared] {
            let database = container.database(with: scope)
            let zones = try await database.allRecordZones()
            for zone in zones where zone.zoneID.zoneName.hasPrefix("Household-") {
                // A complete zone fetch needs no custom query indexes. Never use
                // publicCloudDatabase or a zone belonging to another household.
                var token: CKServerChangeToken?
                var more = true
                var records: [CKRecord.ID: CKRecord] = [:]
                while more {
                    let changes = try await database.recordZoneChanges(inZoneWith: zone.zoneID, since: token)
                    for (id, result) in changes.modificationResultsByID {
                        records[id] = try result.get().record
                    }
                    for deletion in changes.deletions { records.removeValue(forKey: deletion.recordID) }
                    token = changes.changeToken
                    more = changes.moreComing
                }
                for record in records.values where record.recordType == "Household" {
                    var canWrite = scope == .private
                    if scope == .shared, let shareID = record.share?.recordID {
                        let share = try await database.record(for: shareID) as? CKShare
                        canWrite = share?.currentUserParticipant?.permission == .readWrite
                    }
                    households.append(try decode(record, scope: scope, canWrite: canWrite))
                }
            }
        }
        return households.sorted { $0.household.name.localizedStandardCompare($1.household.name) == .orderedAscending }
    }

    func create(name: String) async throws -> CloudHousehold {
        try await checkAccount()
        guard let container else { throw HouseholdError.configuration }
        let zone = CKRecordZone(zoneName: "Household-\(UUID().uuidString)")
        _ = try await container.privateCloudDatabase.modifyRecordZones(saving: [zone], deleting: [])
        let record = CKRecord(recordType: "Household", recordID: CKRecord.ID(recordName: "household", zoneID: zone.zoneID))
        let household = Household(name: name)
        record["payload"] = try JSONEncoder().encode(household) as CKRecordValue
        let saved = try await container.privateCloudDatabase.save(record)
        return try decode(saved, scope: .private, canWrite: true)
    }

    func save(_ household: Household, replacing remote: CloudHousehold) async throws -> CloudHousehold {
        guard remote.canWrite else { throw HouseholdError.readOnly }
        guard let container else { throw HouseholdError.configuration }
        let payload = try JSONEncoder().encode(household)
        guard payload.count < 700_000 else { throw HouseholdError.tooLarge }
        // Use a copy: a failed request must not mutate the displayed baseline.
        let record = remote.record.copy() as! CKRecord
        record["payload"] = payload as CKRecordValue
        do {
            let result = try await container.database(with: remote.scope).modifyRecords(
                saving: [record], deleting: [], savePolicy: .ifServerRecordUnchanged, atomically: true
            )
            guard let saved = result.saveResults[record.recordID] else { throw HouseholdError.invalidData }
            return try decode(saved.get(), scope: remote.scope, canWrite: remote.canWrite)
        } catch {
            if containsConflict(error) { throw HouseholdError.conflict }
            throw error
        }
    }

    private func containsConflict(_ error: Error) -> Bool {
        guard let cloudError = error as? CKError else { return false }
        if cloudError.code == .serverRecordChanged { return true }
        return cloudError.partialErrorsByItemID?.values.contains(where: containsConflict) ?? false
    }

    func share(_ household: CloudHousehold) async throws -> CKShare {
        guard household.isOwner, let container else { throw HouseholdError.readOnly }
        let database = container.privateCloudDatabase
        let root = try await database.record(for: household.record.recordID)
        if let existing = root.share {
            guard let share = try await database.record(for: existing.recordID) as? CKShare else { throw HouseholdError.invalidData }
            return share
        }
        let share = CKShare(rootRecord: root)
        share[CKShare.SystemFieldKey.title] = household.household.name as CKRecordValue
        share.publicPermission = .none
        let result = try await database.modifyRecords(saving: [root, share], deleting: [], savePolicy: .ifServerRecordUnchanged, atomically: true)
        guard let saved = result.saveResults[share.recordID], let savedShare = try saved.get() as? CKShare else {
            throw HouseholdError.invalidData
        }
        return savedShare
    }

    func accept(_ metadata: CKShare.Metadata) async throws {
        try await checkAccount()
        guard let container, metadata.containerIdentifier == container.containerIdentifier else { throw HouseholdError.configuration }
        _ = try await container.accept(metadata)
    }

    func remove(_ household: CloudHousehold) async throws {
        guard let container else { throw HouseholdError.configuration }
        if household.isOwner {
            // Deleting the private zone also removes its share and every record.
            let result = try await container.privateCloudDatabase.modifyRecordZones(saving: [], deleting: [household.record.recordID.zoneID])
            guard let deleted = result.deleteResults[household.record.recordID.zoneID] else { throw HouseholdError.invalidData }
            try deleted.get()
        } else {
            // A participant leaves the share; this does not delete the owner's data.
            guard let shareID = household.record.share?.recordID else { throw HouseholdError.invalidData }
            _ = try await container.sharedCloudDatabase.deleteRecord(withID: shareID)
        }
    }
}
