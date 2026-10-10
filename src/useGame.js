import { computed, onBeforeUnmount, ref } from 'vue';
import { AUGMENTS, MONSTERS, NODE, createMap, reachable, createBoard, findMatches, collapse, calculateTurn, sample, adjacent, COLS } from './game.js';

export function useGame() {
  const phase = ref('map'), map = ref(createMap()), current = ref(null), visited = ref([]);
  const team = ref(MONSTERS.slice(0, 3).map(m => ({ ...m, cooldown: 0 })));
  const hp = ref(280), maxHp = ref(280), attackBonus = ref(0), augments = ref([]);
  const board = ref(createBoard()), enemy = ref(null), turn = ref(1), combos = ref(0), totalDamage = ref(0);
  const busy = ref(false), grabbed = ref(false), cursor = ref(14), moved = ref(false), remaining = ref(6);
  const pointerDrop = ref(null);
  const matched = ref([]), choices = ref([]), recruitCandidate = ref(null);
  const logs = ref(['숲의 입구에 도착했습니다. 첫 번째 경로를 선택하세요.']);
  const helpOpen = ref(false), restartOpen = ref(false), clears = ref(0);
  let timer, deadline = 0, revision = 0, pointerId = null;
  const mobile = ref(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
  const motionQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
  const onMediaChange = e => { mobile.value = e.matches; };
  motionQuery.addEventListener('change', onMediaChange);
  const count = id => augments.value.filter(a => a === id).length;
  const moveTime = computed(() => 6 + count('time') * 1.5);
  const available = computed(() => reachable(map.value, current.value));
  const augmented = computed(() => AUGMENTS.filter(a => count(a.id)).map(a => ({ ...a, count: count(a.id) })));
  const edges = computed(() => map.value.flatMap((row, r) => row.flatMap(n => (map.value[r + 1] ?? []).filter(to => Math.abs(to.col - n.col) <= 1).map(to => ({ from: n, to })))));
  const log = message => { logs.value = [message, ...logs.value].slice(0, 30); };
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const heal = amount => { const actual = Math.min(maxHp.value - hp.value, amount); hp.value += actual; return actual; };
  function stopClock() { clearInterval(timer); timer = null; deadline = 0; }
  function reset() {
    revision++; stopClock(); pointerId = null; pointerDrop.value = null;
    phase.value = 'map'; map.value = createMap(); current.value = null; visited.value = [];
    team.value = MONSTERS.slice(0, 3).map(m => ({ ...m, cooldown: 0 }));
    hp.value = maxHp.value = 280; attackBonus.value = 0; augments.value = [];
    board.value = createBoard(); enemy.value = null; turn.value = 1; combos.value = totalDamage.value = clears.value = 0;
    busy.value = grabbed.value = moved.value = false; remaining.value = 6; cursor.value = 14;
    matched.value = choices.value = []; recruitCandidate.value = null;
    logs.value = ['새로운 탐험이 시작되었습니다.']; restartOpen.value = helpOpen.value = false;
  }
  function selectNode(node) {
    if (phase.value !== 'map' || !available.value.some(n => n.id === node.id)) return;
    current.value = node; visited.value.push(node.id); log(`${node.row + 1}층 · ${NODE[node.type].name}에 진입했습니다.`);
    if (['battle', 'elite', 'boss'].includes(node.type)) {
      const boss = node.type === 'boss', elite = node.type === 'elite';
      const element = sample(['fire', 'water', 'wood', 'light', 'dark'], 1)[0];
      const health = boss ? 680 : Math.round((100 + node.row * 36) * (elite ? 1.55 : 1));
      enemy.value = { name: boss ? '숲의 파수꾼' : elite ? '타락한 숲의 기사' : ['길 잃은 정령', '가시 덩굴짐승', '균열의 포식자'][node.col], icon: boss ? '♛' : elite ? '♜' : '◈', element, hp: health, maxHp: health, attack: boss ? 48 : Math.round((15 + node.row * 4) * (elite ? 1.3 : 1)), counter: boss ? 2 : 1, interval: boss ? 2 : 1 };
      board.value = createBoard(); turn.value = 1; combos.value = totalDamage.value = 0; remaining.value = moveTime.value;
      team.value.forEach(m => { m.cooldown = 0; }); phase.value = 'battle';
    } else if (node.type === 'augment') openAugments();
    else phase.value = node.type;
  }
  function finishNode() { phase.value = 'map'; choices.value = []; }
  function openAugments() { choices.value = sample(AUGMENTS, 3); phase.value = 'augment'; }
  function chooseAugment(a) {
    if (phase.value !== 'augment' || !choices.value.some(c => c.id === a.id)) return;
    augments.value.push(a.id);
    if (a.id === 'vitality') { maxHp.value += 70; heal(70); }
    log(`증강 획득 · ${a.name}`); finishNode();
  }
  function completeGrowth() { if (current.value.type === 'elite') openAugments(); else finishNode(); }
  function chooseGrowth(kind) {
    if (phase.value !== 'reward') return;
    if (kind === 'monster') {
      if (team.value.length >= 6) { phase.value = 'replace'; return; }
      team.value.push({ ...recruitCandidate.value, cooldown: 0 }); log(`${recruitCandidate.value.name}이 파티에 합류했습니다.`);
    } else if (kind === 'train') { attackBonus.value += 6; maxHp.value += 20; heal(20); log('전체 공격력 +6 · 최대 체력 +20'); }
    else if (kind === 'heal') log(`체력 ${heal(95)} 회복`);
    else return;
    completeGrowth();
  }
  function replaceMonster(index) {
    if (phase.value !== 'replace') return;
    if (index >= 0 && index < team.value.length) { team.value[index] = { ...recruitCandidate.value, cooldown: 0 }; log(`${recruitCandidate.value.name}을 파티에 편성했습니다.`); }
    else { attackBonus.value += 6; maxHp.value += 20; heal(20); log('영입 대신 파티를 단련했습니다.'); }
    completeGrowth();
  }
  function rest(train) {
    if (phase.value !== 'rest') return;
    if (train) { attackBonus.value += 8; log('쉼터에서 단련 · 전체 공격력 +8'); }
    else log(`쉼터에서 체력 ${heal(Math.round(maxHp.value * 0.45))} 회복`);
    finishNode();
  }
  function eventChoice(sacrifice) {
    if (phase.value !== 'event') return;
    const cost = Math.round(maxHp.value * 0.2);
    if (sacrifice) {
      if (hp.value <= cost) return;
      hp.value -= cost; log(`유적에 체력 ${cost}을 바쳤습니다.`); openAugments();
    } else { heal(25); log('유적의 샘물로 체력을 회복했습니다.'); finishNode(); }
  }
  function skill(index) {
    const monster = team.value[index];
    if (phase.value !== 'battle' || busy.value || grabbed.value || !monster || monster.cooldown > 0) return;
    const cells = sample(board.value.map((_, i) => i).filter(i => board.value[i] !== monster.element), 5);
    cells.forEach(i => { board.value[i] = monster.element; }); monster.cooldown = 4;
    log(`${monster.name} · ${monster.skill} (대기 4턴)`);
  }
  function begin(index) {
    if (phase.value !== 'battle' || busy.value || restartOpen.value || helpOpen.value) return false;
    if (grabbed.value) return false;
    cursor.value = index; grabbed.value = true; moved.value = false; remaining.value = moveTime.value; return true;
  }
  function swap(index) {
    if (!grabbed.value || busy.value || !adjacent(cursor.value, index) || index < 0 || index >= 30) return;
    if (!moved.value) {
      moved.value = true; deadline = performance.now() + moveTime.value * 1000;
      timer = setInterval(() => { remaining.value = Math.max(0, (deadline - performance.now()) / 1000); if (remaining.value <= 0) release(); }, 35);
    } else if (performance.now() >= deadline) { release(); return; }
    const old = cursor.value; [board.value[old], board.value[index]] = [board.value[index], board.value[old]]; cursor.value = index;
  }
  function release() {
    if (!grabbed.value) return;
    grabbed.value = false; pointerId = null; pointerDrop.value = null; stopClock();
    if (moved.value) resolveTurn();
  }
  async function resolveTurn() {
    if (busy.value || phase.value !== 'battle') return;
    const run = revision; busy.value = true; combos.value = 0; totalDamage.value = 0;
    const allGroups = [];
    // Cap skyfall animation length; ordinary random cascades finish much earlier.
    for (let cascade = 0; cascade < 40; cascade++) {
      const groups = findMatches(board.value);
      if (!groups.length) break;
      allGroups.push(...groups); combos.value = allGroups.length;
      matched.value = groups.flatMap(g => g.cells);
      await sleep(320); if (revision !== run) return;
      board.value = collapse(board.value, new Set(matched.value)); matched.value = [];
      await sleep(180); if (revision !== run) return;
    }
    const result = calculateTurn(allGroups, team.value, augments.value, attackBonus.value, enemy.value.element);
    totalDamage.value = result.damage; heal(result.heal); enemy.value.hp = Math.max(0, enemy.value.hp - result.damage);
    log(`${allGroups.length}콤보 · ${result.damage} 피해${result.heal ? ` · ${result.heal} 회복` : ''}`);
    team.value.forEach(m => { m.cooldown = Math.max(0, m.cooldown - 1); });
    await sleep(450); if (revision !== run) return;
    if (enemy.value.hp === 0) {
      clears.value++; if (count('regen')) heal(Math.round(maxHp.value * 0.18 * count('regen')));
      if (current.value.type === 'boss') phase.value = 'won';
      else { recruitCandidate.value = { ...sample(MONSTERS, 1)[0] }; phase.value = 'reward'; }
      log(`${enemy.value.name}을 쓰러뜨렸습니다.`);
    } else {
      enemy.value.counter--;
      if (enemy.value.counter <= 0) {
        const damage = Math.round(enemy.value.attack * Math.pow(0.85, count('guard')));
        hp.value = Math.max(0, hp.value - damage); enemy.value.counter = enemy.value.interval; log(`적의 반격 · ${damage} 피해`);
      }
      if (hp.value === 0) phase.value = 'lost';
      turn.value++;
    }
    busy.value = false; moved.value = false; remaining.value = moveTime.value;
  }
  function pointerDown(event) {
    if ((mobile.value && event.pointerType !== 'touch') || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const cell = event.target.closest('[data-cell]');
    if (!cell || !begin(Number(cell.dataset.cell))) return;
    event.preventDefault(); pointerId = event.pointerId;
    const rect = cell.getBoundingClientRect();
    pointerDrop.value = {
      x: event.clientX ?? rect.left + rect.width / 2,
      y: event.clientY ?? rect.top + rect.height / 2,
      size: rect.width * 0.8,
      element: board.value[cursor.value],
    };
    event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event) {
    if (!grabbed.value || event.pointerId !== pointerId) return;
    event.preventDefault();
    // Track every pointer movement, including motion within a cell or outside the board.
    pointerDrop.value = { ...pointerDrop.value, x: event.clientX, y: event.clientY };
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * COLS), y = Math.floor((event.clientY - rect.top) / rect.height * 5);
    if (x < 0 || x >= COLS || y < 0 || y >= 5) return;
    // Fast pointer movement still traverses adjacent cells instead of teleporting.
    let budget = 10;
    while (cursor.value !== y * COLS + x && grabbed.value && budget-- > 0) {
      const cx = cursor.value % COLS, cy = Math.floor(cursor.value / COLS);
      const dx = x - cx, dy = y - cy;
      swap(Math.abs(dx) >= Math.abs(dy) && dx !== 0 ? cursor.value + Math.sign(dx) : cursor.value + Math.sign(dy) * COLS);
    }
  }
  function pointerEnd(event) { if (event.pointerId === pointerId) release(); }
  function keydown(event) {
    if (mobile.value || busy.value || phase.value !== 'battle' || pointerId !== null || helpOpen.value || restartOpen.value) return;
    const direction = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -COLS, ArrowDown: COLS, a: -1, d: 1, w: -COLS, s: COLS }[event.key];
    if (direction !== undefined) {
      event.preventDefault(); const next = cursor.value + direction;
      if (next < 0 || next >= 30 || !adjacent(cursor.value, next)) return;
      if (grabbed.value) swap(next); else cursor.value = next;
    } else if ([' ', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault(); if (event.repeat) return;
      if (grabbed.value) release(); else if (event.key !== 'Escape') begin(cursor.value);
    }
  }
  const onBlur = () => release();
  const onVisibility = () => { if (document.hidden) release(); };
  window.addEventListener('blur', onBlur); document.addEventListener('visibilitychange', onVisibility);
  onBeforeUnmount(() => { revision++; stopClock(); motionQuery.removeEventListener('change', onMediaChange); window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVisibility); });
  return { phase, map, current, visited, team, hp, maxHp, attackBonus, augments, board, enemy, turn, combos, totalDamage, busy, grabbed, pointerDrop, cursor, moved, remaining, matched, choices, recruitCandidate, logs, helpOpen, restartOpen, clears, mobile, moveTime, available, augmented, edges, reset, selectNode, chooseAugment, chooseGrowth, replaceMonster, rest, eventChoice, skill, pointerDown, pointerMove, pointerEnd, keydown, release };
}
