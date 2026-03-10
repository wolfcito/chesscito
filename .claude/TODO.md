## Session — 2026-03-09

### Completed This Session
- ✅ GitHub housekeeping: closed #22, #21, #14, #13, #10, #9, #4, #3 (completed work)
- ✅ Milestones M0 y M1 cerrados
- ✅ Issues #20, #12, #11 actualizados con scope correcto
- ✅ 5 nuevos issues de visual polish creados (#44–#48) bajo M3
- ✅ CLAUDE.md: sección "Seguridad — Reglas Duras" agregada
- ✅ fix(ui): ExerciseStarsBar más visible (text-xs/sm, opacity-75, más padding)
- ✅ fix(ui): TIME format "1000 ms" → "1s"
- ✅ fix(ui): Sheet overlay backdrop-opacity 80% → 50%
- ✅ fix(ui): /leaderboard idioma Spanish → English via LEADERBOARD_COPY editorial
- ✅ fix(ui): "Claim Badge..." hint text gateado a isLocalhost (oculto en producción)

### Open Issues Pending (M3)
- #12 claimBadge tx — UI ready, falta validar en device MiniPay
- #11 submitScore tx — idem
- #15 Share Card (screenshotable result)
- #16 Demo Video Script + Recording Checklist
- #17 Deck (8-10 slides)
- #18 Karma GAP Finalize

### Pending / Known Issues
- Shop sheet no captura en Playwright ([skip] button not found: "Shop")
  — El SheetTrigger es un controlled component; investigar si el botón está en DOM
- Stars bar: con los nuevos tamaños, verificar que los 5 botones caben bien en 390px
  (se ve bien en capturas pero confirmar en device real)

---

## Session — 2026-03-08

### Completed This Session
- ✅ Board: homography restaurada con corners calibrados desde `bg-with-grid.png`
  - TL=(11.6,1.4) TR=(88.2,1.4) BL=(0.1,98.2) BR=(99.2,98.2) GAMMA=1.15
- ✅ `chesscito-board.png` confirmado como tablero perspectiva/isométrico 3D
- ✅ `bg-chesscitov2.png` — fondo play hub con safe-area CSS (124% background-size)
- ✅ `bg-splash-chesscito.png` — fondo intro con misma fórmula safe-area
- ✅ Layout play hub: `h-[100dvh] flex-col` sin scroll, todo dentro del safe area
- ✅ Board info cards eliminadas (liberan ~200px de altura)
- ✅ Action bar: 5 icon buttons (↺ 🏅 📊 🛒 🏆) — reemplazables con art propio
- ✅ CLAUDE.md creado con contexto del proyecto
- ✅ Commits granulares a lo largo de toda la sesión

### Pending / Next Steps (Priority Order)

#### 1. Validar board alignment en browser
- Abrir en 390px (MiniPay o DevTools mobile)
- Las casillas iluminadas deben encajar con los tiles del PNG
- Si hay desalineamiento fino, ajustar corners ±0.5% en `board.tsx`

#### 2. Reemplazar iconos de action bar con arte propio
- `↺ Reset` · `🏅 Badge` · `📊 Score` → el usuario generará assets
- Componente `ActionBtn` en `onchain-actions-panel.tsx` acepta cualquier `icon: string`

#### 3. Deploy Mainnet (#13) — cuello de botella principal
- PRIVATE_KEY deployer con fondos Celo
- ETHERSCAN_API_KEY (opcional, para verificación)
- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
- Variables en Vercel + `root dir: apps/web`
- Deploy contratos → registrar addresses en frontend
- Validar 1 submitScore + 1 claimBadge real en device MiniPay

#### 4. Leaderboard v1 (#14)
- Depende de eventos reales en mainnet
- `/api/leaderboard` + top 10 en `/leaderboard`

#### 5. Submission pack
- Demo live + video + Karma GAP + deck

### State at Session Close
- branch: `main`, worktree limpio
- 15 commits nuevos esta sesión
- No secrets expuestos
- Untracked (no commitear): `.agents/`, `.cursor/`, `.gemini/`, `_bmad/`, `design/`, `private/`, `test-results/`
