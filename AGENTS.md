# Repository Guidelines

## Project Structure & Module Organization

This repository contains ROOTBOUND, a browser puzzle roguelike built with Vue and JavaScript. `src/game.js` holds pure puzzle resolution, combat formulas, route generation, and content definitions. `src/useGame.js` manages run state, rewards, timers, and player input. `src/App.vue` contains the interface, while `src/GameIcon.vue` renders shared route and augment icons. `src/style.css` defines the base layout and `src/arcade.css` applies the arcade theme. Engine tests live in `tests/game.test.js`; browser tests live in `e2e/`. Vite builds static assets into `dist/`.

## Build, Test, and Development Commands

Use Node.js 22.12 or newer; Node.js 24 LTS is recommended. Run `npm install` after cloning, then `npm run dev` to start the development server. The server binds to all interfaces so a phone on the same network can open its Network URL. Run `npm run build` to produce the static site and `npm run preview` to inspect the production build. Run `npm test` for the Node test suite.

## Coding Style & Naming Conventions

Use JavaScript ES modules, two-space indentation, single-quoted strings, and semicolons. Use camelCase for functions and variables, uppercase names for exported content constants, and descriptive kebab-case CSS classes. Keep gameplay rules in JavaScript modules and keep templates focused on rendering. Add shared pictograms to `GameIcon.vue`, then reuse them across the map, route choices, and augment cards. No formatter or linter is configured; match adjacent code and avoid unrelated reformatting.

## Testing Guidelines

Use `node:test` with `node:assert/strict`. Name engine test files `*.test.js` and describe behavior in test titles. Cover connected versus disconnected matches, row boundaries, gravity, element damage, and route reachability when changing the engine. There is no numerical coverage threshold. Run `npm run test:browser` for Playwright checks of mouse, keyboard, mobile touch, and route flow when changing controls or screen structure.

## Commit & Pull Request Guidelines

Existing history starts with `chore: initial commit`; continue with concise type-prefixed messages such as `feat: add monster rewards` or `fix: prevent row wrapping`. Pull requests should state the player-visible change, list checks performed, and link relevant issues. Include desktop and mobile screenshots for layout changes. Never commit `node_modules/`, `dist/`, credentials, or local tool state.
