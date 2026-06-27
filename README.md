# NettUp

**A free, open-source desktop app for managing your personal finances** — income, debts, credit cards, installment plans, expenses, budgets, and savings goals. All data stays local on your machine.

Built with Electron + React. Licensed under MIT.

---

## Features

- **Dashboard** — monthly income vs. expenses, net savings, debt-to-income ratio, upcoming payments, and financial-health indicators.
- **Income** — multiple sources with flexible frequencies (weekly, bi-weekly, semi-monthly, monthly, yearly, one-time), normalized to monthly automatically.
- **Debts** — loans, mortgage, auto, student, and personal debts with payoff progress.
- **Credit Cards** — utilization tracking (greener at low usage, redder as it climbs), available credit, and a "closed card" state.
- **Installment Plans** — buy-now-pay-later tracking with real servicer logos (Affirm, Klarna, Afterpay, PayPal, Apple Pay, Zip) and payoff progress.
- **Expenses** — categorized, essential vs. non-essential, recurring or one-time.
- **Budgets** — per-category budgets vs. actual spending (derived from your expenses), with over-budget alerts.
- **Goals** — savings goals with progress tracking.
- **Analytics & Charts** — breakdowns by type/category and interactive visualizations.
- **Reports** — generate and export financial reports to PDF.
- **Themes** — Spy (terminal), Dark, and Light, with the window chrome matched to each.

---

## Download & Install (Windows)

1. Grab the latest **`NettUp Setup x.y.z.exe`** from the [Releases page](https://github.com/MJAVY16/NettUp/releases).
2. Run the installer. Because the app is **unsigned**, Windows SmartScreen may warn you — click **More info → Run anyway**.
3. Launch NettUp from the Start Menu or desktop shortcut.

The app checks for updates on launch and installs them automatically.

---

## Getting Started

1. **New Project** — start a fresh financial profile from the welcome screen (or `Ctrl+N`).
2. **Add your data** — income sources, debts, credit cards, installment plans, expenses, budgets, and goals.
3. **Review** — the Dashboard, Analytics, and Charts tabs summarize everything.

### Saving your work

- Projects are saved as **`.nettup`** files (human-readable JSON inside).
- New projects default to **`Documents\NettUp\`**; you can save anywhere via **Save As**.
- **Autosave** writes changes a couple of seconds after you stop editing; the `*` next to the filename means unsaved changes.
- Double-clicking a `.nettup` file opens it in NettUp.
- Older `.json` project files still open normally.

### Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New Project | `Ctrl+N` |
| Open Project | `Ctrl+O` |
| Save | `Ctrl+S` |
| Save As | `Ctrl+Shift+S` |

---

## Privacy

- **Local-only:** all financial data lives on your machine in your own `.nettup` files.
- **No accounts, no cloud, no telemetry.**

---

## Building from Source

Requirements: Node.js 22+.

```bash
npm install        # install dependencies
npm run dev        # webpack dev server (hot reload)
npm start          # build + launch the app
npm test           # run unit tests
npm run dist-win   # build the Windows installer into release/
```

Releases are published automatically: bump `version` in `package.json`, then push a tag (`git tag vX.Y.Z && git push origin main --tags`). The GitHub Actions workflow builds and publishes the installer.

---

## Tech Stack

- **Electron** + **React** + **TypeScript**
- **Recharts** (charts), **Bootstrap Icons** & **Simple Icons** (icons), **Inter** (font)
- **electron-builder** (packaging) + **electron-updater** (auto-update)

---

## License

MIT — see [LICENSE.txt](LICENSE.txt). Developed by **LogiKore**.
