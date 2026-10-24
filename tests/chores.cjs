const { test } = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')

function load(file, window) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  new Function('exports', 'window', code)(exports, window)
  return exports
}

const { monthWeeks, viennaToday } = load('src/lib/chore-calendar.ts')

test('October 2026 has four Monday-owned weeks including the November boundary', () => {
  const weeks = monthWeeks('2026-10')
  assert.deepEqual(weeks.map(w => w.number), [41, 42, 43, 44])
  assert.equal(weeks[0].start, '2026-10-05')
  assert.equal(weeks[3].end, '2026-11-01')
})
test('ISO week year works across New Year and leap years', () => {
  assert.deepEqual(monthWeeks('2024-12').at(-1), { start: '2024-12-30', end: '2025-01-05', number: 1, year: 2025 })
  assert.equal(monthWeeks('2020-12').at(-1).number, 53)
  assert.equal(monthWeeks('2024-02').at(-1).end, '2024-03-03')
})
test('invalid months are rejected', () => {
  for (const month of ['2026-13', '2026-00', 'abc', '1999-12', '2101-01']) assert.throws(() => monthWeeks(month))
})
test('today follows Vienna at UTC date and daylight-saving boundaries', () => {
  assert.equal(viennaToday(new Date('2026-10-24T22:30:00Z')), '2026-10-25')
  assert.equal(viennaToday(new Date('2026-01-31T23:30:00Z')), '2026-02-01')
})
test('denied browser storage supports unlock, reads and removal in tab memory', () => {
  const window = { get sessionStorage() { throw new Error('SecurityError') }, dispatchEvent() {} }
  const { browserStorage } = load('src/lib/browser-storage.ts', window)
  assert.equal(browserStorage.getItem('pin'), null)
  browserStorage.setItem('pin', '1234')
  assert.equal(browserStorage.getItem('pin'), '1234')
  browserStorage.removeItem('pin')
  assert.equal(browserStorage.getItem('pin'), null)
})
