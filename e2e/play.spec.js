import { test, expect } from '@playwright/test';

// Keep the battle deterministic so input tests check a known match and reward.
async function readyBattle(page, health = 1) {
  await page.goto('/');
  await page.locator('.route-choice').first().click();
  await expect(page.locator('.board')).toBeVisible();
  await page.evaluate(health => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    const types = ['water', 'wood', 'light', 'dark', 'heart', 'fire'];
    const board = Array.from({ length: 30 }, (_, i) => types[(i % 6 + Math.floor(i / 6)) % 6]);
    board[0] = board[1] = board[8] = 'fire'; board[2] = 'water';
    g.board.value = board; g.enemy.value.hp = g.enemy.value.maxHp = health;
    g.enemy.value.element = 'wood';
  }, health);
}
async function center(page, cell) {
  const r = await page.locator(`[data-cell="${cell}"]`).boundingBox();
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}
test('route, drag, battle reward and augment form a playable loop', async ({ page, context, isMobile }) => {
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await readyBattle(page);
  const start = await center(page, 8), end = await center(page, 2);
  if (isMobile) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...end, id: 1 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.mouse.move(start.x, start.y); await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 4 }); await page.mouse.up();
  }
  await expect(page.getByRole('heading', { name: '승리가 남긴 선물' })).toBeVisible();
  await page.getByRole('button', { name: /함께 성장하기/ }).click();
  await expect(page.locator('.route-choice').first()).toBeVisible();
  await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    g.available.value[0].type = 'augment';
  });
  await page.locator('.route-choice').first().click();
  await expect(page.locator('.reward-card')).toHaveCount(3);
  await page.locator('.reward-card').first().click();
  await expect(page.locator('.augment-row')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
test('keyboard moves cursor and held orb on PC; mobile ignores keyboard', async ({ page, isMobile }) => {
  await readyBattle(page, 9999);
  await page.locator('.board').focus();
  const before = await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    return { board: [...g.board.value], cursor: g.cursor.value };
  });
  await page.keyboard.press('Space'); await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.dragged-orb')).toHaveCount(0);
  const after = await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    return { board: [...g.board.value], cursor: g.cursor.value };
  });
  if (isMobile) expect(after).toEqual(before);
  else {
    expect(after.cursor).toBe(before.cursor - 1);
    expect(after.board[before.cursor - 1]).toBe(before.board[before.cursor]);
    await page.keyboard.press('Space');
    await expect(page.locator('.battle-panel .tiny-tag')).toHaveText('TURN 02');
  }
});
test('held drop follows pointer coordinates within cells and outside the board', async ({ page, context, isMobile }) => {
  await readyBattle(page, 9999);
  const start = await center(page, 8);
  const cdp = isMobile ? await context.newCDPSession(page) : null;
  const move = async position => {
    if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...position, id: 1 }] });
    else await page.mouse.move(position.x, position.y);
  };
  const checkPosition = async position => {
    await expect.poll(async () => {
      const rect = await page.locator('.dragged-orb').boundingBox();
      return rect ? Math.hypot(rect.x + rect.width / 2 - position.x, rect.y + rect.height / 2 - position.y) : 1000;
    }).toBeLessThan(2);
  };
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...start, id: 1 }] });
  else { await page.mouse.move(start.x, start.y); await page.mouse.down(); }
  await checkPosition(start);
  await expect(page.locator('[data-cell="8"] .orb')).toBeHidden();
  await expect(page.locator('.dragged-orb')).toHaveClass(/fire/);
  const offset = { x: start.x + 7, y: start.y + 5 };
  await move(offset); await checkPosition(offset);
  await expect(page.locator('.pointer-held')).toHaveAttribute('data-cell', '8');
  const next = await center(page, 2);
  await move(next); await checkPosition(next);
  await expect(page.locator('.pointer-held')).toHaveAttribute('data-cell', '2');
  await expect(page.locator('.dragged-orb')).toHaveClass(/fire/);
  const boardRect = await page.locator('.board').boundingBox();
  const outside = { x: boardRect.x - 6, y: next.y };
  await move(outside); await checkPosition(outside);
  if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  else await page.mouse.up();
  await expect(page.locator('.dragged-orb')).toHaveCount(0);
  await expect(page.locator('.pointer-held')).toHaveCount(0);
});
test('boss victory, defeat, full-party replacement and restart resolve correctly', async ({ page }) => {
  await readyBattle(page);
  await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    g.current.value.type = 'boss'; g.board.value[2] = 'fire';
    // Use the normal drag lifecycle and an adjacent swap outside the prepared match.
    g.pointerDown({ pointerType: 'touch', pointerId: 99, target: document.querySelector('[data-cell="28"]'), currentTarget: { focus() {}, setPointerCapture() {} }, preventDefault() {} });
    g.moved.value = true; g.release();
  });
  await expect(page.getByRole('heading', { name: '숲은 당신을 기억합니다' })).toBeVisible();
  await page.getByRole('button', { name: '새로운 탐험 시작' }).click();
  await expect(page.locator('.augment-row')).toHaveCount(0);
  await page.locator('.route-choice').first().click();
  await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    g.hp.value = 1; g.enemy.value.hp = 99999; g.enemy.value.counter = 1;
    g.grabbed.value = true; g.moved.value = true; g.release();
  });
  await expect(page.getByRole('heading', { name: '탐험은 여기까지' })).toBeVisible();
  await page.getByRole('button', { name: '새로운 탐험 시작' }).click();
  await page.evaluate(() => {
    const g = document.querySelector('#app').__vue_app__._instance.setupState.g;
    g.selectNode(g.available.value[0]);
    g.team.value = [...g.team.value, ...g.team.value.map(m => ({ ...m }))];
    g.recruitCandidate.value = { id: 'test', name: '테스트 동료', element: 'light', attack: 42, icon: '✧', skill: '빛 드롭 5개 생성' };
    g.phase.value = 'reward';
  });
  await page.getByRole('button', { name: /테스트 동료/ }).click();
  await page.locator('.replacement-list button').first().click();
  await expect(page.locator('.monster-card')).toHaveCount(6);
  await expect(page.locator('.monster-card').first()).toContainText('테스트 동료');
});
