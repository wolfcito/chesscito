# ShopUpgradeable Security Audit Report

**Date:** 2026-03-12
**Contract:** `apps/contracts/contracts/ShopUpgradeable.sol`
**Auditor:** Automated (Slither) + Manual Red Team
**Status:** PASSED (all findings resolved)

---

## 1. Slither Static Analysis

**Tool:** Slither v0.10.x, 101 detectors
**Result:** 0 findings for ShopUpgradeable (high/medium/low)

| Finding | Severity | Verdict |
|---------|----------|---------|
| `__gap` naming convention | Informational | False positive — standard OZ pattern |
| `__gap` unused state | Informational | False positive — intentional storage gap |

Other findings were for Badges/Scoreboard (pre-existing, unrelated).

---

## 2. Red Team Manual Audit

### Attack Vectors Tested

| # | Vector | Verdict | Details |
|---|--------|---------|---------|
| 1 | Reentrancy via callback token | NOT EXPLOITABLE | `nonReentrant` guard (OZ v5, ERC-7201 storage) prevents re-entry |
| 2 | Malicious token (owner compromise) | LOW RISK | Requires compromised owner key; no user fund theft possible |
| 3 | Decimal manipulation | **FIXED** | Added `unitAmount == 0` guard + decimals range [6,18] |
| 4 | Upgrade attack | LOW RISK | Inherent to proxy pattern; ProxyAdmin held by Safe multisig |
| 5 | Price manipulation | NOT EXPLOITABLE | Fixed storage prices, no oracle dependency |
| 6 | Front-running / MEV | LOW RISK | No price impact; Celo BFT has fast finality |
| 7 | Treasury theft | NOT EXPLOITABLE | CEI pattern + cached treasury address |
| 8 | Access control bypass | NOT EXPLOITABLE | All admin functions `onlyOwner` (OZ) |
| 9 | Denial of service | LOW RISK | Users can switch tokens if one is paused |
| 10 | Integer overflow | LOW RISK | Solidity 0.8.x reverts on overflow; DoS variant fixed via decimals cap |

### Findings & Fixes Applied

#### CRITICAL — Zero-amount purchase (FIXED)

**Before:** If owner added a token with `decimals < 6`, `_normalizePrice` truncation could yield `unitAmount = 0`, allowing free item purchases.

**Fix:** Added `if (unitAmount == 0) revert InvalidPrice();` after `_normalizePrice` in `buyItem`.

#### HIGH — Decimal range unbounded (FIXED)

**Before:** `setAcceptedToken` only rejected `decimals == 0`. Allowed `decimals = 1` (free purchases via truncation) or `decimals = 255` (overflow DoS).

**Fix:** Changed validation to `if (tokenDecimals < 6 || tokenDecimals > 18) revert InvalidDecimals();` — only standard ERC-20 decimal ranges accepted.

---

## 3. Test Coverage

- **29 tests passing** (up from 24 in initial implementation)
- Added tests for: decimal range [6,18] limits, setItems batch, event parsing, zero-amount guard
- All revert paths covered with specific custom error assertions

---

## 4. Security Properties Verified

- [x] SafeERC20 for all token transfers (no raw `transfer`/`transferFrom`)
- [x] ReentrancyGuard on `buyItem` (OZ v5, ERC-7201 namespaced storage, proxy-safe)
- [x] CEI pattern: all checks before external call, event after
- [x] `_disableInitializers()` in constructor prevents re-initialization
- [x] Storage gap: 4 own slots + 46 gap = 50 total budget
- [x] All admin functions protected by `onlyOwner`
- [x] Treasury cached in local variable before external call
- [x] Decimal range enforced: [6, 18]
- [x] Zero-amount transfer prevented in buyItem
- [x] maxQuantityPerTx cap prevents large quantity abuse

---

## 5. Deployment Info

### Celo Sepolia Testnet

| Component | Address |
|-----------|---------|
| Shop Proxy | `0xB72994af866aA743f1C1da0DB815aD172A57D2d9` |
| Implementation | `0xBb1A931E8f5011A04D95567386044FDC1d04c403` |
| ProxyAdmin | `0x97cd94FDAFc15f9859807557d30ca55B18EA0cfa` |
| Treasury | `0x917497b64eeB85859edcf2e4ca64059eDfeC1923` |
| Owner | `0x917497b64eeB85859edcf2e4ca64059eDfeC1923` (Safe) |

**Note:** Testnet deployment uses the pre-hardening implementation. Mainnet will deploy with the hardened version.

### Accepted Tokens (Mainnet — configured in deploy script)

| Token | Address | Decimals |
|-------|---------|----------|
| USDC | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 |
| USDT | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 |
| cUSD | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 |

---

## 6. Remaining Risks (Accepted)

1. **Upgradeable proxy inherent risk:** ProxyAdmin can upgrade implementation to anything. Mitigated by Safe multisig ownership.
2. **Fee-on-transfer tokens:** If a fee-on-transfer token is added, treasury receives less than logged amount. Mitigated by only accepting known stablecoins (USDC/USDT/cUSD).
3. **Token pause risk:** If USDC/USDT pauses globally, purchases with that token fail. Users can switch to another accepted token.

---

## 7. Verdict

**SAFE FOR MAINNET** after hardening fixes applied. All critical and high findings resolved. Remaining risks are inherent to the proxy pattern and accepted.
