# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

سارونة (Saroona) — an Arabic two-team trivia game. RTL UI rendered inside a simulated iOS device frame (402×874), running entirely in the browser with no build step.

## Running locally

```powershell
pwsh ./serve.ps1
```

Custom PowerShell static file server on `http://localhost:5175`. Required (not `python -m http.server` etc.) because:
- `.jsx` must be served as `application/javascript` so `@babel/standalone` can transpile it
- `Cache-Control: no-store` is set so edits show up on reload — `index.html` also cache-busts CSS via `?v=N`, bump that query when CSS changes

There is no build, no test runner, no linter, no `package.json`. Edit a file and reload the page.

## Architecture

### Script load order is load-bearing

`index.html` loads scripts in a fixed order. Each `screens-*.jsx` / `common.jsx` / `ios-frame.jsx` attaches its exports to `window.*` namespaces (`window.SaroonaCommon`, `window.SaroonaScreens1`, `window.SaroonaScreens2`, `window.SaroonaAuth`, `window.IOSStatusBar`). `app.jsx` reads them from `window` at module top-level — so it must load last, and any new shared component must be both attached to `window` in its source file and listed in `index.html` before `app.jsx`.

There are no ES modules and no imports. React/ReactDOM/Babel are loaded from unpkg as UMD globals.

### Top-level state machine

`App()` in `app.jsx` is a single `useState('stage')` switch over: `login → otp → start → teams → category → question → result → scoreboard → end`. The `transition(next)` helper toggles CSS classes for the exit animation before swapping the screen. Every screen receives its props (teams, scores, current question, etc.) from `App` — screens are pure presentational components and call back via `onNext`/`onAnswer`/etc.

Game flow: two teams alternate (`activeTeam = 1 - activeTeam`), every 5 questions inserts a `scoreboard` screen, ending after `tweaks.totalQuestions` (default 20). Used questions are tracked by `${catKey}-${index}` keys in a Set so the same question doesn't repeat within a game.

### Question bank

`questions.js` defines `window.QUESTION_BANK` as `{ categoryKey: { name, icon, questions: [...] } }`. Each question has a `type` of `mcq` | `tf` | `text` | `image`, and answer shape varies by type (`answer: number` for mcq index, `answer: boolean` for tf, `answer: string[]` of accepted variants for text, etc.). When adding question types, both `pickCategory` in `app.jsx` and the rendering switch in `QuestionScreen` (`screens-2.jsx`) need to handle them.

### Theming and tweaks

`window.__TWEAK_DEFAULTS` in `index.html` seeds runtime-tunable settings (theme, font, timer seconds, total questions, points per correct). The TweaksPanel UI lives at the bottom of `App()` and writes back via `setTweak`. Themes are CSS variable sets on `[data-theme="rose|mint|grape"]` in `styles.css`; `App` sets the attribute on `<html>` whenever `tweaks.theme` changes. Add a new theme by adding a `[data-theme="..."]` block in `styles.css` and a radio option in `app.jsx`.

### iOS device frame

`ios-frame.jsx` exports presentational iOS chrome (`IOSStatusBar`, etc.). The actual frame (rounded corners, dynamic island, home indicator, status bar overlay, 54px top padding for app content) is hand-built inline in `app.jsx`'s `ReactDOM.createRoot(...).render(...)` call. The frame's fixed 402×874 size is then scaled to fit the viewport by `scalePhone()` in `index.html`, which also runs on a `MutationObserver` so re-renders re-fit.

### `design_extract/`

Snapshot of an earlier design iteration (older copies of the same source files plus reference images and chat logs). Not loaded at runtime — safe to ignore unless intentionally diffing against history.
