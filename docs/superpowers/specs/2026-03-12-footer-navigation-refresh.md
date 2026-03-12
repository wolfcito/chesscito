# Chesscito — Footer Navigation Refresh Spec v1.1

## Objetivo

Redisenar el footer de juego para Chesscito:

* reducir clutter
* mejorar jerarquia visual
* separar claramente **HUD**, **accion contextual** y **navegacion persistente**
* mantener el tablero como foco principal
* soportar estados dinamicos sin ensuciar la UI

---

## 1. Arquitectura final

### Orden de capas en pantalla

```text
[Board / game area]

[HUD strip]
Score | Time | Target

[Contextual Action Slot]
Submit Score / Use Shield / Claim Badge / Retry

[Persistent Bottom Dock]
Badges | Shop | Ranking
```

### Regla principal

* **HUD** = informacion, nunca navegacion
* **Action Slot** = una sola accion prioritaria a la vez
* **Dock** = destinos persistentes de navegacion

---

## 2. Estructura del footer

### 2.1 HUD strip

Contiene:

* `Score`
* `Time`
* `Target`

#### Comportamiento

* siempre visible durante gameplay
* no interactivo
* sin affordance de boton
* visualmente mas sutil que el CTA

#### Estilo

* label en uppercase
* valor principal mas grande
* target con color de acento

#### Ejemplo

* Score: `1,250`
* Time: `0:42`
* Target: `e5`

---

### 2.2 Contextual Action Slot

Zona central entre HUD y dock.

#### Reglas

* muestra **maximo una accion**
* solo aparece cuando aplica
* si no hay accion contextual, el slot colapsa o queda con altura minima
* debe ser el elemento mas visible del footer, pero sin dominar toda la pantalla

#### Acciones soportadas

* `Submit Score`
* `Use Shield`
* `Claim Badge`
* `Retry`

---

### 2.3 Persistent Bottom Dock

Tres botones fijos:

* `Badges`
* `Shop`
* `Ranking`

#### Reglas

* siempre visibles
* mismo peso visual entre si
* iconos y labels consistentes
* no competir con el CTA

---

## 3. Prioridad visual

### Jerarquia correcta

1. **Board**
2. **Contextual Action**
3. **HUD values**
4. **Dock navigation**

### Que evitar

* CTA mas brillante que todo el tablero
* dock decorativamente mas pesado que el action slot
* HUD con apariencia de botones

---

## 4. Especificacion visual

### 4.1 Footer container

#### Estilo

* fondo dark fantasy / deep navy
* leve glass tint o gradiente
* borde superior sutil
* esquinas superiores redondeadas si aplica al layout general

#### Tokens sugeridos

* `footer.bg = #061126`
* `footer.bg.alt = #0A1630`
* `footer.border = rgba(110, 160, 255, 0.08)`

---

### 4.2 HUD strip

#### Layout

* 3 columnas iguales
* separacion vertical con divisores finos
* alineacion centrada

#### Tipografia

* labels: uppercase, tracking amplio
* values: bold, claros, muy legibles

#### Tokens sugeridos

* `hud.label = rgba(210, 225, 255, 0.55)`
* `hud.value = #EAF2FF`
* `hud.target = #20E0D8`
* `hud.divider = rgba(255,255,255,0.08)`

#### Tamanos sugeridos

* label: `11-12px`
* value: `20-24px`
* altura HUD: `72-84px`

#### Regla

El HUD debe sentirse como **instrument panel**, no como una card independiente.

---

### 4.3 Contextual Action Slot

#### Layout

* ancho: `78-86%` del footer interno
* centrado
* una sola linea
* alto tipo capsula

#### Tamanos sugeridos

* altura boton: `52-60px`
* icono: `18-22px`
* texto: `16-18px`, semibold/bold
* separacion vertical con HUD: `10-14px`
* separacion con dock: `12-16px`

#### Efecto

* glow suave y controlado
* sin bloom agresivo
* sombra exterior corta

#### Regla

Debe destacar, pero no parecer un modal comprimido.

---

### 4.4 Bottom Dock

#### Layout

* tres botones equidistantes
* icono arriba, label abajo
* padding vertical compacto
* suficiente espacio tactil

#### Tamanos sugeridos

* touch target: minimo `56x56`
* icono: `20-24px`
* label: `12-14px`

#### Estilo

* botones con base comun
* mismo contenedor
* brillo bajo a medio
* activo ligeramente resaltado

#### Tokens sugeridos

* `dock.item.bg = rgba(120, 160, 255, 0.12)`
* `dock.item.bg.active = rgba(120, 190, 255, 0.18)`
* `dock.label = rgba(210,225,255,0.72)`
* `dock.label.active = #F3F7FF`

---

## 5. Sistema semantico de color del CTA

### 5.1 Submit Score

* **Uso**: cuando el jugador completo la pieza y tiene score pendiente
* **Color**: familia cyan / teal
* **Tokens**:
  * `cta.submit.bg = linear-gradient(180deg, #23C8F3 0%, #16A9E0 100%)`
  * `cta.submit.glow = rgba(35, 200, 243, 0.24)`
  * `cta.submit.text = #FFFFFF`
* **Label**: `Submit Score`
* **Prioridad**: Alta

### 5.2 Use Shield

* **Uso**: cuando el jugador falla y tiene shields disponibles
* **Color**: familia amber / orange
* **Tokens**:
  * `cta.shield.bg = linear-gradient(180deg, #F6A400 0%, #EE8B00 100%)`
  * `cta.shield.glow = rgba(246, 164, 0, 0.22)`
  * `cta.shield.text = #FFF8ED`
* **Label**: `Use Shield`
* **Metadata**: contador como badge pequeno: `2 left`

### 5.3 Claim Badge

* **Uso**: cuando el jugador desbloquea badge en la sesion actual
* **Color**: familia purple / reward
* **Tokens**:
  * `cta.badge.bg = linear-gradient(180deg, #9B59FF 0%, #7B3FF2 100%)`
  * `cta.badge.glow = rgba(155, 89, 255, 0.22)`
  * `cta.badge.text = #FFFFFF`
* **Label**: `Claim Badge`
* **Prioridad**: Alta, pero debajo de survival/progression blocking actions

### 5.4 Retry

* **Uso**: cuando no hay shield disponible o cuando repetir es la accion mas logica
* **Color**: familia neutral slate
* **Tokens**:
  * `cta.retry.bg = rgba(148, 170, 210, 0.14)`
  * `cta.retry.border = rgba(190, 210, 255, 0.08)`
  * `cta.retry.text = rgba(234, 242, 255, 0.82)`
  * `cta.retry.glow = rgba(255,255,255,0.04)`
* **Label**: `Retry`
* **Regla**: no debe parecer disabled; secundario pero claramente disponible

---

## 6. Reglas de aparicion

### 6.1 Prioridad de acciones

Las acciones son **mutuamente excluyentes por estado del juego** — en la practica no
compiten simultaneamente. La prioridad aplica como fallback defensivo:

1. `Use Shield` — solo cuando `phase === "failure"` y `shieldsAvailable > 0`
2. `Submit Score` — solo cuando pieza completada (`badgeEarned && !pieceCompleted`)
3. `Claim Badge` — solo cuando badge desbloqueado, no reclamado, y no hay score pendiente
4. `Retry` — solo cuando `phase === "failure"` y `shieldsAvailable === 0`

#### Nota sobre estados mutuamente excluyentes

* `Use Shield` y `Retry` requieren `phase === "failure"` — nunca coexisten con `Submit Score`
* `Submit Score` requiere pieza completada exitosamente — nunca coexiste con failure states
* `Claim Badge` aparece solo si no hay accion de mayor prioridad activa

### 6.2 Tabla de visibilidad

| Estado | HUD | CTA | Dock |
|--------|-----|-----|------|
| Jugando (moviendo piezas) | visible | oculto | visible |
| Exito en ejercicio (auto-advance, 1.5s) | visible | oculto | visible |
| Pieza completada, score pendiente | visible | `Submit Score` | visible |
| Fallo con shields > 0 | visible | `Use Shield` | visible |
| Badge desbloqueado, no reclamado | visible | `Claim Badge` | visible |
| Fallo sin shields | visible | `Retry` | visible |
| Wallet desconectada / chain incorrecta | visible | oculto | visible |

#### Notas

* **Between-exercise gap** (1.5s auto-advance tras exito): CTA oculto, el juego avanza solo
* **Wallet desconectada**: CTA no se muestra; las acciones on-chain requieren wallet conectada
* **Badge ya reclamado** (`hasClaimedBadge === true`): `Claim Badge` no aparece

---

## 7. Comportamiento del action slot

### Cuando no hay CTA

* el slot colapsa a altura minima o desaparece
* el HUD y el dock quedan mas cerca

### Transicion

* fade + slide vertical suave
* duracion: `160-220ms`
* easing suave, no bouncy

### Regla

Nada de parpadeos, rebotes fuertes o animaciones que distraigan del tablero.

---

## 8. Espaciado recomendado

### Vertical

* board -> HUD: segun layout general
* HUD padding top/bottom: `12-14px`
* HUD -> CTA: `10-14px`
* CTA -> dock: `12-16px`
* dock padding bottom: `14-18px`

### Horizontal

* gutter general: `16-20px`

### Compactacion

Objetivo: que el footer completo ocupe menos que la version actual sin perder legibilidad.

---

## 9. Estados interactivos

### CTA

* **default**: estilo normal con glow
* **pressed**: leve reduccion de escala `0.98`, sombra/glow menor
* **loading**: spinner al lado izquierdo, label estable (`Submitting...`, `Using Shield...`, `Claiming...`)
* **disabled**: si alguna accion depende de red/proceso

### Dock items

* **default**: base comun
* **active**: base mas brillante, label mas clara
* **pressed**: feedback inmediato

---

## 10. Iconografia y consistencia

### Regla

Todos los iconos del dock deben compartir:

* mismo tamano optico
* mismo peso visual
* mismo contenedor base
* misma intensidad luminica general

### Evitar

* un icono hiper detallado junto a otro plano
* trofeo mas brillante que shop por simple asset mismatch
* badges con marco grueso junto a shop sin marco

---

## 11. Microcopy final

### Dock

* `Badges`
* `Shop`
* `Ranking`

### CTA

* `Submit Score`
* `Use Shield`
* `Claim Badge`
* `Retry`

### CTA loading labels

* `Submitting...`
* `Using Shield...`
* `Claiming...`

### HUD

* `SCORE`
* `TIME`
* `TARGET`

### Editorial changes required

* Rename `CTA_LABELS.resetTrial` to `CTA_LABELS.retry` with value `"Retry"`
* Add loading labels to `CTA_LABELS` or a new `FOOTER_CTA_COPY` constant

---

## 11.1 Claim Badge vs. BadgeEarnedPrompt

The existing `BadgeEarnedPrompt` overlay fires when the player completes the last exercise
of a piece with enough stars. It offers 3 actions: Claim Badge, Submit Score, Later.

**Decision**: `BadgeEarnedPrompt` stays as-is — it is the primary moment of celebration.
The footer `Claim Badge` CTA is a **fallback** for when the player dismissed the overlay
with "Later" but the badge remains claimable. It also appears when the player returns to
a completed piece where the badge was never claimed.

* `BadgeEarnedPrompt` = immediate reward moment (fullscreen overlay)
* Footer `Claim Badge` = persistent reminder if badge was not claimed yet

### Dock "active" state

A dock item is "active" when its sheet is currently open (e.g., ShopSheet, BadgeSheet,
LeaderboardSheet). The active state uses `dock.item.bg.active` and `dock.label.active` tokens.

---

## 12. Decisiones de diseno confirmadas

### Reset eliminado

> **Reset is removed entirely from the primary game UI.**
> The player-facing flow uses `Retry` instead of `Reset`.
> Auto-reset on failure remains system-driven and invisible to the user.

* No persistent Reset button
* No contextual Reset action
* Retry is the only replay/restart-style action exposed to the player
* Si algun dia se necesita un "abandonar intento", va en overflow menu o debug panel, nunca en el footer

---

## 13. Pseudologica de implementacion

```ts
type ContextAction =
  | 'submitScore'
  | 'useShield'
  | 'claimBadge'
  | 'retry'
  | null;

function getContextAction(state: {
  phase: 'ready' | 'success' | 'failure';
  shieldsAvailable: number;
  scorePending: boolean;       // badgeEarned && !pieceCompleted (on-chain)
  badgeClaimable: boolean;     // badgeEarned && !hasClaimedBadge
  isConnected: boolean;
  isCorrectChain: boolean;
  isBusy: boolean;             // any tx in flight
}): ContextAction {
  // No CTA when wallet not ready or tx in progress
  if (!state.isConnected || !state.isCorrectChain) return null;
  if (state.isBusy) return null; // keep current CTA in loading state instead

  // Failure states
  if (state.phase === 'failure' && state.shieldsAvailable > 0) return 'useShield';
  if (state.phase === 'failure') return 'retry';

  // Success / progression states
  if (state.scorePending) return 'submitScore';
  if (state.badgeClaimable) return 'claimBadge';

  return null;
}
```

**Note on `isBusy`**: When a tx is in flight, the CTA stays visible in its `loading`
state (spinner + "Submitting..." etc.). The `getContextAction` function is not called
during loading — the component holds the current action and shows the loading variant.

---

## 14. Criterios de aceptacion

### UX

* el usuario entiende el footer en menos de 2 segundos
* el dock no contiene botones ambiguos o deshabilitados
* el CTA siempre representa una sola accion clara
* el tablero conserva protagonismo

### UI

* maximo 3 items persistentes en el dock
* maximo 1 CTA visible a la vez
* el HUD no parece interactivo
* el CTA es consistente en tamano, forma y comportamiento entre variantes
* el footer completo se siente mas compacto que la version previa
