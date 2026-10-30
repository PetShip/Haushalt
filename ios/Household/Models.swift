import Foundation

struct Household: Codable, Equatable {
    var version = 1
    var name: String
    var members: [HouseholdMember] = []
    var tasks: [HouseholdTask] = []
    var completions: [TaskCompletion] = []
    var weeks: [WeekConfirmation] = []
}

struct HouseholdMember: Codable, Identifiable, Equatable {
    var id = UUID()
    var nickname: String
    var joinedOn: Date
    var archived = false
}

struct HouseholdTask: Codable, Identifiable, Equatable {
    var id = UUID()
    var title: String
    var archived = false
}

struct TaskCompletion: Codable, Identifiable, Equatable {
    var id = UUID()
    var memberID: UUID
    var taskID: UUID
    var date: Date
}

struct WeekConfirmation: Codable, Equatable {
    var memberID: UUID
    var monday: String
    var completed: Bool
}

struct ChoreWeek: Identifiable, Equatable {
    var id: String { monday }
    let monday: String
    let start: Date
    let end: Date
    let nextMonday: Date
    let number: Int
    let year: Int
}

enum ChoreCalendar {
    // A fixed household timezone gives all invited devices the same boundaries.
    static var calendar: Calendar {
        var result = Calendar(identifier: .iso8601)
        result.timeZone = TimeZone(identifier: "Europe/Vienna")!
        return result
    }

    static func dayKey(_ date: Date) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year!, c.month!, c.day!)
    }

    static func weeks(in month: Date) -> [ChoreWeek] {
        let calendar = calendar
        guard let range = calendar.dateInterval(of: .month, for: month) else { return [] }
        let weekday = calendar.component(.weekday, from: range.start)
        let offset = (9 - weekday) % 7
        var monday = calendar.date(byAdding: .day, value: offset, to: range.start)!
        var result: [ChoreWeek] = []
        while monday < range.end {
            let next = calendar.date(byAdding: .day, value: 7, to: monday)!
            result.append(ChoreWeek(
                monday: dayKey(monday), start: monday,
                end: calendar.date(byAdding: .day, value: 6, to: monday)!,
                nextMonday: next,
                number: calendar.component(.weekOfYear, from: monday),
                year: calendar.component(.yearForWeekOfYear, from: monday)
            ))
            monday = next
        }
        return result
    }

    static func requiredWeeks(in month: Date, for member: HouseholdMember) -> [ChoreWeek] {
        let joinedWeek = calendar.dateInterval(of: .weekOfYear, for: member.joinedOn)!.start
        return weeks(in: month).filter { $0.start >= joinedWeek }
    }

    static func eligible(household: Household, member: HouseholdMember, month: Date, now: Date) -> Bool {
        let required = requiredWeeks(in: month, for: member)
        guard let last = required.last, now >= last.nextMonday else { return false }
        return required.allSatisfy { week in
            household.weeks.contains { $0.memberID == member.id && $0.monday == week.monday && $0.completed }
        }
    }
}
