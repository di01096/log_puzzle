export const COLS = 6;
export const ROWS = 5;
export const ELEMENTS = ['fire', 'water', 'wood', 'light', 'dark', 'heart'];
export const ELEMENT = {
  fire: { name: '불', icon: '◆', color: '#ef8069' },
  water: { name: '물', icon: '≋', color: '#70b7e1' },
  wood: { name: '숲', icon: '♠', color: '#9dc886' },
  light: { name: '빛', icon: '✦', color: '#e7c872' },
  dark: { name: '어둠', icon: '☾', color: '#b89cd3' },
  heart: { name: '회복', icon: '♥', color: '#e7a4b6' },
};
export const MONSTERS = [
  { id: 'fox', name: '잿불 여우', element: 'fire', icon: '🦊', attack: 26, skill: '불 드롭 5개 생성' },
  { id: 'otter', name: '물결 수달', element: 'water', icon: '🦦', attack: 25, skill: '물 드롭 5개 생성' },
  { id: 'deer', name: '이끼 사슴', element: 'wood', icon: '🦌', attack: 25, skill: '숲 드롭 5개 생성' },
  { id: 'owl', name: '새벽 올빼미', element: 'light', icon: '🦉', attack: 32, skill: '빛 드롭 5개 생성' },
  { id: 'raven', name: '그림자 까마귀', element: 'dark', icon: '🐦‍⬛', attack: 34, skill: '어둠 드롭 5개 생성' },
  { id: 'wolf', name: '서리 늑대', element: 'water', icon: '🐺', attack: 38, skill: '물 드롭 5개 생성' },
  { id: 'dragon', name: '어린 화룡', element: 'fire', icon: '🐲', attack: 40, skill: '불 드롭 5개 생성' },
  { id: 'turtle', name: '고목 거북', element: 'wood', icon: '🐢', attack: 36, skill: '숲 드롭 5개 생성' },
];
export const AUGMENTS = [
  { id: 'power', icon: '⚔', name: '벼린 발톱', desc: '파티 전체 공격력 +20%.', rarity: '전투' },
  { id: 'time', icon: '◷', name: '느리게 흐르는 숲', desc: '드롭 조작 시간 +1.5초.', rarity: '조작' },
  { id: 'combo', icon: '✧', name: '연쇄의 메아리', desc: '콤보당 피해 증가량 +12%.', rarity: '콤보' },
  { id: 'vitality', icon: '♡', name: '거목의 심장', desc: '최대 체력 +70. 체력 70 회복.', rarity: '생존' },
  { id: 'regen', icon: '❀', name: '숲의 숨결', desc: '전투 승리 후 최대 체력 18% 회복.', rarity: '회복' },
  { id: 'fire', icon: '◆', name: '불씨의 서약', desc: '불 속성 몬스터의 공격력 +55%.', rarity: '속성' },
  { id: 'heal', icon: '♥', name: '온화한 빛', desc: '회복 드롭의 회복량 +60%.', rarity: '회복' },
  { id: 'guard', icon: '⬡', name: '나무껍질 갑옷', desc: '적에게 받는 피해 15% 감소.', rarity: '방어' },
  { id: 'rainbow', icon: '❖', name: '프리즘', desc: '한 턴에 공격 속성 3종 이상 매치하면 피해 +45%.', rarity: '다속성' },
];
export const NODE = {
  battle: { name: '일반 전투', icon: '⚔', description: '몬스터와 싸우고 성장 보상 획득' },
  elite: { name: '정예 전투', icon: '♜', description: '강한 적 · 성장 보상과 증강 획득' },
  augment: { name: '증강의 제단', icon: '✧', description: '세 가지 증강 중 하나 선택' },
  rest: { name: '숲속 쉼터', icon: '☕', description: '체력 회복 또는 공격력 단련' },
  event: { name: '잊힌 유적', icon: '?', description: '보상과 대가를 직접 선택' },
  boss: { name: '숲의 파수꾼', icon: '♛', description: '최종 보스 · 탐험의 마지막 관문' },
};
export function sample(items, amount, rng = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, amount);
}
export function randomOrb(rng = Math.random) { return ELEMENTS[Math.floor(rng() * ELEMENTS.length)]; }
export function createBoard(rng = Math.random) {
  const board = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    const valid = ELEMENTS.filter(e => !(i % COLS >= 2 && board[i - 1] === e && board[i - 2] === e) && !(i >= COLS * 2 && board[i - COLS] === e && board[i - COLS * 2] === e));
    board.push(valid[Math.floor(rng() * valid.length)]);
  }
  return board;
}
export function adjacent(a, b) {
  return Math.abs(Math.floor(a / COLS) - Math.floor(b / COLS)) + Math.abs(a % COLS - b % COLS) === 1;
}
export function findMatches(board) {
  const marked = new Set();
  for (let i = 0; i < board.length; i++) {
    const e = board[i];
    if (!e) continue;
    if (i % COLS <= COLS - 3 && board[i + 1] === e && board[i + 2] === e) [i, i + 1, i + 2].forEach(n => marked.add(n));
    if (i < COLS * (ROWS - 2) && board[i + COLS] === e && board[i + COLS * 2] === e) [i, i + COLS, i + COLS * 2].forEach(n => marked.add(n));
  }
  const groups = [];
  while (marked.size) {
    const start = marked.values().next().value;
    const cells = [start];
    marked.delete(start);
    for (let p = 0; p < cells.length; p++) {
      const i = cells[p];
      for (const n of [i - 1, i + 1, i - COLS, i + COLS]) {
        if (marked.has(n) && adjacent(i, n) && board[n] === board[start]) { marked.delete(n); cells.push(n); }
      }
    }
    groups.push({ element: board[start], cells });
  }
  return groups;
}
export function collapse(board, cleared, rng = Math.random) {
  const next = [...board];
  for (let col = 0; col < COLS; col++) {
    const kept = [];
    for (let row = ROWS - 1; row >= 0; row--) { const i = row * COLS + col; if (!cleared.has(i)) kept.push(board[i]); }
    for (let row = ROWS - 1; row >= 0; row--) next[row * COLS + col] = kept[ROWS - 1 - row] ?? randomOrb(rng);
  }
  return next;
}
export function createMap(rng = Math.random) {
  const types = ['battle', 'battle', 'elite', 'rest', 'event', 'augment'];
  return Array.from({ length: 8 }, (_, row) => (row === 7 ? [1] : [0, 1, 2]).map(col => ({
    id: `${row}-${col}`, row, col,
    type: row === 7 ? 'boss' : row === 0 ? 'battle' : row === 3 ? (col === 1 ? 'rest' : 'augment') : types[Math.floor(rng() * types.length)],
  })));
}
export function reachable(map, current) {
  const row = current ? current.row + 1 : 0;
  return (map[row] ?? []).filter(n => !current || Math.abs(n.col - current.col) <= 1);
}
export function advantage(attack, defense) {
  if ((attack === 'fire' && defense === 'wood') || (attack === 'wood' && defense === 'water') || (attack === 'water' && defense === 'fire') || (attack === 'light' && defense === 'dark') || (attack === 'dark' && defense === 'light')) return 2;
  if ((defense === 'fire' && attack === 'wood') || (defense === 'wood' && attack === 'water') || (defense === 'water' && attack === 'fire')) return 0.5;
  return 1;
}
export function calculateTurn(groups, team, augments, attackBonus, enemyElement) {
  const count = id => augments.filter(a => a === id).length;
  const multiplier = 1 + Math.max(0, groups.length - 1) * (0.25 + count('combo') * 0.12);
  let damage = 0, heal = 0;
  for (const group of groups) {
    const scale = 1 + (group.cells.length - 3) * 0.25;
    if (group.element === 'heart') { heal += 22 * scale * (1 + count('heal') * 0.6); continue; }
    const base = team.filter(m => m.element === group.element).reduce((sum, m) => sum + m.attack + attackBonus, 0);
    damage += base * scale * (1 + count('power') * 0.2) * (group.element === 'fire' ? 1 + count('fire') * 0.55 : 1) * advantage(group.element, enemyElement);
  }
  const rainbow = new Set(groups.filter(g => g.element !== 'heart').map(g => g.element)).size >= 3;
  return { damage: Math.round(damage * multiplier * (rainbow ? 1 + count('rainbow') * 0.45 : 1)), heal: Math.round(heal * multiplier) };
}
