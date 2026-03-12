# ShopUpgradeable Multi-Token Design

## Problem

The current `Shop.sol` is non-upgradeable with a single immutable `paymentToken` (USDC). MiniPay users may hold USDT or cUSD instead, causing "insufficient funds" errors even when they have equivalent USD stablecoins. Any future changes require a full redeploy and frontend migration.

## Goal

Replace Shop with an upgradeable contract that accepts USDC, USDT, and cUSD. Users pay with whichever stablecoin they have. Prices are stored once in USD canonical units (6 decimals) and normalized per token at purchase time.

## Scope

- **In scope:** Upgradeable Shop contract, multi-token payments, deployment script, tests, frontend integration
- **Out of scope:** CELO native token payments (roadmap for web users), oracle-based pricing, quantity discounts
- **Roadmap:** CELO native support for web-based users (non-MiniPay)

## Tokens

| Token | Address (Celo Mainnet) | Decimals | Notes |
|-------|------------------------|----------|-------|
| USDC  | `0xcebA9300f2b948710d2653dD7B07f33A8B32118C` | 6 | Circle native |
| USDT  | `0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e` | 6 | Tether native |
| cUSD  | `0x765DE816845861e75A25fCA122bb6898B8B1282a` | 18 | Mento Dollar (rebranding to USDm) |

Note: cUSD is the Mento Dollar, currently being rebranded to USDm. The contract address remains the same. It uses 18 decimals unlike USDC/USDT which use 6.

## Contract Design: ShopUpgradeable

### Inheritance

```solidity
Initializable, OwnableUpgradeable, PausableUpgradeable, ReentrancyGuardUpgradeable
```

Following the same pattern as `ScoreboardUpgradeable` and `BadgesUpgradeable` (Transparent Proxy).

### Imports

```solidity
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
```

```solidity
using SafeERC20 for IERC20;
```

### Constructor

```solidity
/// @custom:oz-upgrades-unsafe-allow constructor
constructor() {
    _disableInitializers();
}
```

### Storage (slot budget)

```solidity
// ── Own storage (4 slots) ──────────────────────────────────────────
// slot 0: acceptedTokens mapping
mapping(address => uint8) public acceptedTokens;  // 0 = not accepted
// slot 1: items mapping
mapping(uint256 => ItemConfig) public items;
// slot 2: treasury
address public treasury;
// slot 3: maxQuantityPerTx
uint256 public maxQuantityPerTx;

struct ItemConfig {
    uint256 priceUsd6;  // price in USD with 6 decimals (e.g. 25000 = $0.025)
    bool enabled;
}

// ── Gap (46 free = 50 budget − 4 own) ──────────────────────────────
uint256[46] private __gap;
```

### Key Functions

#### `initialize`

```solidity
function initialize(
    address initialTreasury,
    uint256 initialMaxQuantityPerTx,
    address initialOwner
) public initializer {
    if (initialTreasury == address(0)) revert InvalidAddress();
    __Ownable_init(initialOwner);
    __Pausable_init();
    __ReentrancyGuard_init();
    treasury = initialTreasury;
    maxQuantityPerTx = initialMaxQuantityPerTx;
}
```

No tokens are configured at init time — added via `setAcceptedToken` after deployment for flexibility.

#### `buyItem` (changed signature)

```solidity
function buyItem(uint256 itemId, uint256 quantity, address token) external whenNotPaused nonReentrant
```

Flow:
1. Validate: `quantity > 0`, within `maxQuantityPerTx`, item configured (`priceUsd6 > 0`) + enabled
2. Validate: `acceptedTokens[token] > 0` — revert `TokenNotAccepted` if not whitelisted
3. Validate: `token != address(0)` — revert `InvalidAddress`
4. Compute amount: `_normalizePrice(item.priceUsd6, acceptedTokens[token]) * quantity`
5. `IERC20(token).safeTransferFrom(msg.sender, treasury, amount)`
6. Emit `ItemPurchased` (includes `token` address and `totalTokenAmount`)

#### `_normalizePrice` (internal pure)

```solidity
function _normalizePrice(uint256 priceUsd6, uint8 tokenDecimals) internal pure returns (uint256) {
    if (tokenDecimals >= 6) {
        return priceUsd6 * 10 ** (tokenDecimals - 6);
    }
    // Note: integer division truncates for tokens with < 6 decimals.
    // No current accepted token uses < 6 decimals.
    return priceUsd6 / 10 ** (6 - tokenDecimals);
}
```

Example: item price = 25000 (0.025 USD)
- USDC (6 dec): 25000 * 10^0 = 25000
- USDT (6 dec): 25000 * 10^0 = 25000
- cUSD (18 dec): 25000 * 10^12 = 25000000000000000

#### Admin Functions

```solidity
function setAcceptedToken(address token, uint8 decimals) external onlyOwner
    // Reverts: InvalidAddress if token == address(0)
    // Reverts: InvalidDecimals if decimals == 0
    // Emits: AcceptedTokenUpdated(token, decimals)

function removeAcceptedToken(address token) external onlyOwner
    // Sets acceptedTokens[token] = 0
    // Emits: AcceptedTokenRemoved(token)

function setItem(uint256 itemId, uint256 priceUsd6, bool enabled) external onlyOwner
    // Reverts: InvalidPrice if priceUsd6 == 0
    // Emits: ItemConfigured(itemId, priceUsd6, enabled)

function setItems(uint256[] ids, uint256[] prices, bool[] enabled) external onlyOwner
    // Batch version. Reverts: LengthMismatch, InvalidPrice

function disableItem(uint256 itemId) external onlyOwner
    // Sets items[itemId].enabled = false without changing price
    // Emits: ItemConfigured(itemId, items[itemId].priceUsd6, false)

function setTreasury(address next) external onlyOwner
    // Reverts: InvalidAddress if next == address(0)
    // Reverts: SameTreasury if next == treasury
    // Emits: TreasuryUpdated(previous, next)

function setMaxQuantityPerTx(uint256 max) external onlyOwner
    // Emits: MaxQuantityPerTxUpdated(max)

function pause() / unpause() external onlyOwner
```

### Events

```solidity
event ItemPurchased(
    address indexed buyer,
    uint256 indexed itemId,
    uint256 quantity,
    uint256 unitPriceUsd6,
    uint256 totalTokenAmount,
    address indexed token,
    address treasury
);
event AcceptedTokenUpdated(address indexed token, uint8 decimals);
event AcceptedTokenRemoved(address indexed token);
event ItemConfigured(uint256 indexed itemId, uint256 priceUsd6, bool enabled);
event TreasuryUpdated(address indexed previous, address indexed next);
event MaxQuantityPerTxUpdated(uint256 maxQuantity);
```

### Errors

```solidity
error InvalidQuantity();
error QuantityExceedsMax(uint256 quantity, uint256 max);
error ItemNotConfigured(uint256 itemId);
error ItemDisabled(uint256 itemId);
error TokenNotAccepted(address token);
error InvalidAddress();
error InvalidPrice();
error InvalidDecimals();
error SameTreasury();
error LengthMismatch();
```

## Deployment Strategy

### Script: `deploy-shop-upgradeable.ts`

Following `deploy-proxies.ts` pattern:

1. Deploy `ShopUpgradeable` via `upgrades.deployProxy` with Transparent Proxy
2. Call `setAcceptedToken` for USDC (6), USDT (6), cUSD (18)
3. Call `setItem` for existing items (Founder Badge = 100000, Retry Shield = 25000)
4. Transfer ProxyAdmin to Safe owner
5. Append `shopProxy`, `shopImpl`, `shopProxyAdmin` fields to existing `deployments/{network}.json`

### Security Review Gate

Before deploying to mainnet, the contract must pass:

1. **Automated analysis** — run Slither or equivalent static analyzer, resolve all high/medium findings
2. **Code review** — dedicated review focused on access control, reentrancy, token handling, and upgrade safety
3. **Testnet deployment** — deploy to Celo Sepolia, run full test suite against live proxy, verify all flows in MiniPay testnet
4. **Red team** — attempt to exploit: call with malicious token, re-entrancy via callback token, upgrade to malicious impl, price manipulation via decimals mismatch

No mainnet deployment until all 4 gates pass.

### Migration

- Same treasury address (`0x917497b64eeb85859edcf2e4ca64059edfec1923`)
- Same item IDs (1 = Founder Badge, 2 = Retry Shield)
- Same prices in USD canonical (100000 = $0.10, 25000 = $0.025)
- Frontend updates `NEXT_PUBLIC_SHOP_ADDRESS` to new proxy address
- Old Shop can be paused or left as-is (no funds stored)

## Frontend Changes

### Contract Layer (`apps/web/src/lib/contracts/`)

**`shop.ts`** — Update ABI:
- `buyItem` signature: `(uint256 itemId, uint256 quantity, address token)`
- Add `acceptedTokens(address) -> uint8` view function
- Keep `getItem` as-is (returns `priceUsd6` + `enabled`)

**`tokens.ts`** (new) — Token registry + normalization utility:
```typescript
export const ACCEPTED_TOKENS = [
  { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
  { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6 },
  { symbol: "cUSD", address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18 },
] as const;

/** Convert priceUsd6 to token amount (mirrors contract _normalizePrice) */
export function normalizePrice(priceUsd6: bigint, tokenDecimals: number): bigint {
  if (tokenDecimals >= 6) {
    return priceUsd6 * 10n ** BigInt(tokenDecimals - 6);
  }
  return priceUsd6 / 10n ** BigInt(6 - tokenDecimals);
}
```

### Purchase Flow (`apps/web/src/app/play-hub/page.tsx`)

1. On mount: batch-read balances of all 3 tokens for the connected wallet
2. When user selects an item to buy:
   - Filter tokens where balance >= item price (use `normalizePrice` from `tokens.ts`)
   - If 1 token with sufficient balance: auto-select it
   - If multiple: show token picker (simple buttons with token symbol)
   - If none: show "Insufficient balance" with which tokens are accepted
3. `approve(shopAddress, normalizedAmount)` on selected token
4. `buyItem(itemId, 1, selectedTokenAddress)`

### UI Changes

- Confirm sheet shows token symbol + amount in the selected token
- Price displayed as "$0.025" (USD) regardless of token, with small token badge
- Error message for insufficient funds shows: "You need $0.025 — accepted: USDC, USDT, cUSD"

## Tests

### Contract Tests (`apps/contracts/test/ShopUpgradeable.ts`)

Fixture deploys proxy + parameterized `MockERC20` contract (configurable name, symbol, decimals). Creates 3 instances: mock6A (6 dec), mock6B (6 dec), mock18 (18 dec).

Test cases:
- Buy with 6-decimal token — verify correct amount transferred
- Buy with 18-decimal token — verify normalization (amount = priceUsd6 * 10^12)
- Reject unaccepted token — revert `TokenNotAccepted`
- Reject token address(0) — revert `InvalidAddress`
- Reject disabled item — revert `ItemDisabled`
- Reject unconfigured item — revert `ItemNotConfigured`
- Reject zero quantity / exceeds max — revert `InvalidQuantity` / `QuantityExceedsMax`
- Reject insufficient allowance — revert from SafeERC20
- Reject insufficient balance — revert from SafeERC20
- Owner can add/remove accepted tokens
- Owner cannot set token with decimals=0 — revert `InvalidDecimals`
- Owner cannot set token address(0) — revert `InvalidAddress`
- Owner can update items, treasury
- Owner cannot set treasury to address(0) — revert `InvalidAddress`
- Owner cannot set treasury to same address — revert `SameTreasury`
- `disableItem` delists without changing price
- Re-adding a previously removed token works
- Proxy upgrade preserves state (items, treasury, accepted tokens)
- Pause blocks purchases, unpause resumes
- Non-owner cannot call admin functions

### Mock Contract

```solidity
// contracts/test/MockERC20.sol
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    constructor(string memory name, string memory symbol, uint8 dec) ERC20(name, symbol) {
        _decimals = dec;
    }
    function decimals() public view override returns (uint8) { return _decimals; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}
```

### Server Tests

No changes needed — Shop purchases don't go through the signing API.

## File Changes Summary

| File | Change |
|------|--------|
| `apps/contracts/contracts/ShopUpgradeable.sol` | New contract |
| `apps/contracts/contracts/test/MockERC20.sol` | New parameterized mock for tests |
| `apps/contracts/scripts/deploy-shop-upgradeable.ts` | New deployment script |
| `apps/contracts/test/ShopUpgradeable.ts` | New test suite |
| `apps/web/src/lib/contracts/shop.ts` | Update ABI (new `buyItem` sig + `acceptedTokens` view) |
| `apps/web/src/lib/contracts/tokens.ts` | New: token registry + `normalizePrice` utility |
| `apps/web/src/app/play-hub/page.tsx` | Multi-token balance reads, token selection, updated `buyItem` call |
| `apps/web/.env` / `.env.example` | Update `NEXT_PUBLIC_SHOP_ADDRESS` after deploy |
| `apps/contracts/deployments/celo.json` | Append `shopProxy`/`shopImpl`/`shopProxyAdmin` fields |
