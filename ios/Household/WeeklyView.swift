import SwiftUI

struct WeeklyView: View {
    @EnvironmentObject private var store: HouseholdStore
    @State private var month = Date()

    private var title: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "de_AT")
        formatter.timeZone = ChoreCalendar.calendar.timeZone
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: month)
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    HStack {
                        Button { moveMonth(-1) } label: { Image(systemName: "chevron.left").padding(8) }.accessibilityLabel("Voriger Monat")
                        Spacer()
                        Text(title).font(.headline).accessibilityAddTraits(.isHeader)
                        Spacer()
                        Button { moveMonth(1) } label: { Image(systemName: "chevron.right").padding(8) }.accessibilityLabel("Nächster Monat")
                    }
                    Button("Aktueller Monat") { month = Date() }
                }
                if let household = store.household {
                    if household.members.filter({ !$0.archived }).isEmpty {
                        ContentUnavailableView("Noch keine Familienmitglieder", systemImage: "person.badge.plus", description: Text("Füge unter Familie einen Spitznamen hinzu."))
                    }
                    ForEach(household.members.filter { !$0.archived }) { member in
                        let weeks = ChoreCalendar.requiredWeeks(in: month, for: member)
                        let eligible = ChoreCalendar.eligible(household: household, member: member, month: month, now: Date())
                        Section(member.nickname) {
                            Label(eligible ? "Taschengeld freigegeben" : "Taschengeld noch nicht freigegeben", systemImage: eligible ? "checkmark.circle.fill" : "clock")
                                .foregroundStyle(eligible ? .green : .secondary)
                            if weeks.isEmpty { Text("Für diesen Monat sind keine Wochen erforderlich.").foregroundStyle(.secondary) }
                            ForEach(weeks) { week in
                                let completed = household.weeks.contains { $0.memberID == member.id && $0.monday == week.monday && $0.completed }
                                Button {
                                    Task { await store.confirm(memberID: member.id, week: week, completed: !completed) }
                                } label: {
                                    HStack(alignment: .center) {
                                        Image(systemName: completed ? "checkmark.circle.fill" : "circle").font(.title2).foregroundStyle(completed ? .green : .secondary)
                                        VStack(alignment: .leading) {
                                            Text("KW \(week.number) / \(String(week.year))").font(.headline)
                                            Text("\(week.start.formatted(.dateTime.day().month())) – \(week.end.formatted(.dateTime.day().month()))").font(.subheadline).foregroundStyle(.secondary)
                                            if Date() >= week.start && Date() < week.nextMonday { Text("Aktuelle Woche").font(.caption).foregroundStyle(.teal) }
                                        }
                                        Spacer()
                                        Text(week.start > Date() ? "Zukünftig" : completed ? "Erledigt" : "Offen").font(.caption)
                                    }
                                    .contentShape(Rectangle())
                                }
                                .buttonStyle(.plain)
                                .disabled(!store.canWrite || week.start > Date())
                                .accessibilityLabel("\(member.nickname), Kalenderwoche \(week.number), \(completed ? "erledigt" : "offen")")
                                .accessibilityHint("Bestätigung der gesamten Wochenhausarbeit ändern")
                            }
                        }
                    }
                }
                Section("So wird gerechnet") {
                    Text("Eine Woche gehört zum Monat ihres Montags. Ab der Eintrittswoche werden alle Wochen bestätigt. Taschengeld ist freigegeben, sobald alle erforderlichen Wochen erledigt sind und die letzte Woche beendet ist. Kalender und Grenzen verwenden Europe/Vienna.")
                    Text("Die App zeigt die Freigabe an. Sie überweist kein Geld.").foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Hausarbeit")
            .refreshable { await store.refresh() }
        }
    }

    private func moveMonth(_ offset: Int) {
        if let start = ChoreCalendar.calendar.dateInterval(of: .month, for: month)?.start,
           let next = ChoreCalendar.calendar.date(byAdding: .month, value: offset, to: start) { month = next }
    }
}
