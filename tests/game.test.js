import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, ELEMENTS, MONSTERS, createBoard, findMatches, collapse, createMap, reachable, calculateTurn, adjacent } from '../src/game.js';

const empty = () => Array(COLS * ROWS).fill(null);
test('new boards contain 30 valid orbs without free starting matches', () => {
  for (let n = 0; n < 100; n++) {
    const board = createBoard();
    assert.equal(board.length, 30);
    assert.ok(board.every(e => ELEMENTS.includes(e)));
    assert.deepEqual(findMatches(board), []);
  }
});
test('a cross counts as one combo; disconnected matches of the same element count separately', () => {
  const board = empty();
  [1, 6, 7, 8, 13, 27, 28, 29].forEach(i => { board[i] = 'fire'; });
  const matches = findMatches(board);
  assert.equal(matches.length, 2);
  assert.deepEqual(matches.map(g => g.cells.length).sort(), [3, 5]);
});
test('horizontal matches and cursor movement cannot wrap across rows', () => {
  const board = empty();
  [5, 6, 7].forEach(i => { board[i] = 'water'; });
  assert.equal(findMatches(board).length, 0);
  assert.equal(adjacent(5, 6), false);
  assert.equal(adjacent(5, 11), true);
});
test('gravity preserves remaining column order and refills removed cells', () => {
  const board = Array.from({ length: 30 }, (_, i) => ELEMENTS[Math.floor(i / 6)]);
  const next = collapse(board, new Set([12, 18]), () => .99);
  assert.deepEqual([0, 6, 12, 18, 24].map(i => next[i]), ['heart', 'heart', 'fire', 'water', 'dark']);
  assert.equal(next[1], board[1]);
});
test('every generated branch can reach the boss without skipping floors', () => {
  const map = createMap();
  assert.equal(reachable(map, null).length, 3);
  for (const row of map.slice(0, -1)) for (const n of row) {
    const next = reachable(map, n);
    assert.ok(next.length > 0);
    assert.ok(next.every(m => m.row === n.row + 1 && Math.abs(m.col - n.col) <= 1));
  }
  assert.equal(map[7][0].type, 'boss');
  assert.deepEqual(reachable(map, map[7][0]), []);
});
test('only party elements attack; heart matches heal without causing damage', () => {
  const group = element => ({ element, cells: [0, 1, 2] });
  assert.equal(calculateTurn([group('dark')], [MONSTERS[0]], [], 0, 'wood').damage, 0);
  assert.deepEqual(calculateTurn([group('heart')], [MONSTERS[0]], [], 0, 'wood'), { damage: 0, heal: 22 });
  assert.equal(calculateTurn([group('fire')], [MONSTERS[0]], [], 0, 'wood').damage, 52);
  assert.equal(calculateTurn([group('fire')], [MONSTERS[0]], [], 0, 'water').damage, 13);
});
test('combo, attack and rainbow augments apply to combined cascade groups', () => {
  const groups = ['fire', 'water', 'wood'].map(element => ({ element, cells: [0, 1, 2] }));
  const plain = calculateTurn(groups, MONSTERS.slice(0, 3), [], 0, 'light');
  const augmented = calculateTurn(groups, MONSTERS.slice(0, 3), ['power', 'combo', 'rainbow'], 6, 'light');
  assert.equal(plain.damage, 114);
  assert.equal(augmented.damage, Math.round(94 * 1.2 * 1.74 * 1.45));
});
