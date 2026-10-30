import XCTest
@testable import HouseholdCore

final class ChoreCalendarTests: XCTestCase {
    func date(_ value: String) -> Date { ISO8601DateFormatter().date(from: value)! }

    func testOctoberOwnsMondayWeeksAndEndsInNovember() {
        let weeks = ChoreCalendar.weeks(in: date("2026-10-15T12:00:00Z"))
        XCTAssertEqual(weeks.map(\.number), [41, 42, 43, 44])
        XCTAssertEqual(weeks.first?.monday, "2026-10-05")
        XCTAssertEqual(ChoreCalendar.dayKey(weeks.last!.end), "2026-11-01")
    }

    func testISOYearBoundary() {
        let week = ChoreCalendar.weeks(in: date("2024-12-01T12:00:00Z")).last!
        XCTAssertEqual(week.monday, "2024-12-30")
        XCTAssertEqual(week.number, 1)
        XCTAssertEqual(week.year, 2025)
    }

    func testAllWeeksRequiredAndFinalSundayMustFinish() {
        let month = date("2026-10-01T12:00:00Z")
        let member = HouseholdMember(nickname: "Test", joinedOn: month)
        var household = Household(name: "Test", members: [member])
        let weeks = ChoreCalendar.requiredWeeks(in: month, for: member)
        household.weeks = weeks.map { WeekConfirmation(memberID: member.id, monday: $0.monday, completed: true) }
        XCTAssertFalse(ChoreCalendar.eligible(household: household, member: member, month: month, now: date("2026-11-01T22:59:59Z")))
        XCTAssertTrue(ChoreCalendar.eligible(household: household, member: member, month: month, now: date("2026-11-01T23:00:00Z")))
        household.weeks.removeLast()
        XCTAssertFalse(ChoreCalendar.eligible(household: household, member: member, month: month, now: date("2026-11-02T12:00:00Z")))
    }

    func testJoiningMidMonthDoesNotRequireEarlierWeeks() {
        let month = date("2026-10-15T12:00:00Z")
        let member = HouseholdMember(nickname: "Test", joinedOn: date("2026-10-21T12:00:00Z"))
        XCTAssertEqual(ChoreCalendar.requiredWeeks(in: month, for: member).map(\.number), [43, 44])
        XCTAssertTrue(ChoreCalendar.requiredWeeks(in: date("2026-09-15T12:00:00Z"), for: member).isEmpty)
    }

    func testAnotherMembersConfirmationDoesNotCount() {
        let month = date("2026-10-15T12:00:00Z")
        let member = HouseholdMember(nickname: "Test", joinedOn: month)
        var household = Household(name: "Test", members: [member])
        household.weeks = ChoreCalendar.requiredWeeks(in: month, for: member).map { WeekConfirmation(memberID: UUID(), monday: $0.monday, completed: true) }
        XCTAssertFalse(ChoreCalendar.eligible(household: household, member: member, month: month, now: date("2026-11-03T12:00:00Z")))
    }

    func testEmptyHouseholdRoundTripContainsNoSeededPeople() throws {
        let empty = Household(name: "Test")
        let decoded = try JSONDecoder().decode(Household.self, from: JSONEncoder().encode(empty))
        XCTAssertEqual(empty, decoded)
        XCTAssertTrue(decoded.members.isEmpty)
        XCTAssertTrue(decoded.tasks.isEmpty)
        XCTAssertTrue(decoded.completions.isEmpty)
        XCTAssertTrue(decoded.weeks.isEmpty)
    }
}
