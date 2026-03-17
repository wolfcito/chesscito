# Mint your Victory — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players mint arena victories as ERC-721 NFTs with micro-fees, split 80/20 between treasury and prize pool.

**Architecture:** New `VictoryNFTUpgradeable` contract (ERC-721 + EIP-712 + multi-token payments). New `/api/sign-victory` endpoint using existing signing infra. Frontend mint button in `ArenaEndState` for wins only.

**Tech Stack:** Solidity 0.8.28, OpenZeppelin v5 upgradeable, Hardhat, Next.js 14 API routes, ethers v6, wagmi/viem

**Spec:** `docs/superpowers/specs/2026-03-17-mint-your-victory-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `apps/contracts/contracts/VictoryNFTUpgradeable.sol` | ERC-721 + EIP-712 + payment split |
| Create | `apps/contracts/test/VictoryNFT.ts` | Contract unit tests |
| Create | `apps/contracts/scripts/deploy-victory-nft.ts` | Deploy script with proxy |
| Create | `apps/web/src/lib/contracts/victory.ts` | ABI + helpers |
| Create | `apps/web/src/app/api/sign-victory/route.ts` | EIP-712 signing endpoint |
| Modify | `apps/web/src/lib/server/demo-signing.ts` | Add `victoryNFTAddress` to config |
| Modify | `apps/web/src/lib/contracts/chains.ts` | Add `getVictoryNFTAddress()` |
| Modify | `apps/web/src/lib/contracts/tokens.ts` | Add `VICTORY_PRICES` |
| Modify | `apps/web/src/lib/content/editorial.ts` | Add `VICTORY_MINT_COPY` |
| Modify | `apps/web/src/lib/game/use-chess-game.ts` | Add `moveCount` + `elapsedMs` tracking |
| Modify | `apps/web/src/components/arena/arena-end-state.tsx` | Add mint button on win |
| Modify | `apps/web/src/app/arena/page.tsx` | Wire mint flow + wallet state |

---

## Task 1: Smart Contract — VictoryNFTUpgradeable

**Files:**
- Create: `apps/contracts/contracts/VictoryNFTUpgradeable.sol`
- Create: `apps/contracts/test/VictoryNFT.ts`

- [ ] **Step 1: Write the contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {EIP712Upgradeable} from "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract VictoryNFTUpgradeable is
    Initializable,
    ERC721Upgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    EIP712Upgradeable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    // Errors
    error InvalidDifficulty(uint8 difficulty);
    error InvalidMoves();
    error InvalidTime();
    error InvalidAddress();
    error InvalidPrice();
    error InvalidDecimals();
    error InvalidSigner();
    error InvalidSignature();
    error SignatureExpired(uint256 deadline);
    error NonceUsed(address player, uint256 nonce);
    error TokenNotAccepted(address token);
    error PriceNotSet(uint8 difficulty);
    error MintCooldown(uint256 nextMintAt);
    error SameAddress();

    // Events
    event VictoryMinted(
        address indexed player,
        uint256 indexed tokenId,
        uint8 difficulty,
        uint16 totalMoves,
        uint32 timeMs,
        address indexed token,
        uint256 totalAmount
    );
    event PriceUpdated(uint8 difficulty, uint256 priceUsd6);
    event TreasuryUpdated(address indexed previous, address indexed next);
    event PrizePoolUpdated(address indexed previous, address indexed next);
    event SignerUpdated(address indexed signer);
    event MintCooldownUpdated(uint256 cooldown);
    event AcceptedTokenUpdated(address indexed token, uint8 decimals);
    event AcceptedTokenRemoved(address indexed token);

    // Constants
    bytes32 private constant VICTORY_TYPEHASH = keccak256(
        "VictoryMint(address player,uint8 difficulty,uint16 totalMoves,uint32 timeMs,uint256 nonce,uint256 deadline)"
    );

    // Storage
    struct VictoryData {
        uint8 difficulty;
        uint16 totalMoves;
        uint32 timeMs;
        uint64 mintedAt;
    }

    mapping(address => uint8) public acceptedTokens;
    mapping(uint8 => uint256) public priceUsd6;
    address public treasury;
    address public prizePool;
    address public signer;
    uint256 public mintCooldown;
    mapping(address => uint256) public lastMintAt;
    mapping(address => mapping(uint256 => bool)) public usedNonces;
    mapping(uint256 => VictoryData) public victories;
    uint256 private _nextTokenId;
    string private _baseTokenURI;

    // Own slots: acceptedTokens, priceUsd6, treasury, prizePool, signer,
    //   mintCooldown, lastMintAt, usedNonces, victories, _nextTokenId, _baseTokenURI = 11
    // Gap: 50 - 11 = 39 free
    uint256[39] private __gap;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() { _disableInitializers(); }

    function initialize(
        address initialTreasury,
        address initialPrizePool,
        address initialSigner,
        address initialOwner
    ) public initializer {
        if (initialTreasury == address(0)) revert InvalidAddress();
        if (initialPrizePool == address(0)) revert InvalidAddress();
        if (initialSigner == address(0)) revert InvalidSigner();
        if (initialTreasury == initialPrizePool) revert SameAddress();

        __ERC721_init("Chesscito Victory", "VICTORY");
        __Ownable_init(initialOwner);
        __Pausable_init();
        __EIP712_init("VictoryNFT", "1");

        treasury = initialTreasury;
        prizePool = initialPrizePool;
        signer = initialSigner;
        mintCooldown = 30;
        _nextTokenId = 1;
    }

    // Core
    function mintSigned(
        uint8 difficulty,
        uint16 totalMoves,
        uint32 timeMs,
        address token,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external whenNotPaused nonReentrant {
        if (difficulty < 1 || difficulty > 3) revert InvalidDifficulty(difficulty);
        if (totalMoves == 0) revert InvalidMoves();
        if (timeMs == 0) revert InvalidTime();
        if (block.timestamp > deadline) revert SignatureExpired(deadline);
        if (usedNonces[msg.sender][nonce]) revert NonceUsed(msg.sender, nonce);
        if (block.timestamp < lastMintAt[msg.sender] + mintCooldown) {
            revert MintCooldown(lastMintAt[msg.sender] + mintCooldown);
        }

        uint8 tokenDecimals = acceptedTokens[token];
        if (tokenDecimals == 0) revert TokenNotAccepted(token);

        uint256 price = priceUsd6[difficulty];
        if (price == 0) revert PriceNotSet(difficulty);

        _verifySignature(msg.sender, difficulty, totalMoves, timeMs, nonce, deadline, signature);

        usedNonces[msg.sender][nonce] = true;
        lastMintAt[msg.sender] = block.timestamp;

        // Payment split
        uint256 totalAmount = _normalizePrice(price, tokenDecimals);
        uint256 treasuryAmount = totalAmount * 80 / 100;
        uint256 poolAmount = totalAmount - treasuryAmount;
        IERC20(token).safeTransferFrom(msg.sender, treasury, treasuryAmount);
        IERC20(token).safeTransferFrom(msg.sender, prizePool, poolAmount);

        // Mint
        uint256 tokenId = _nextTokenId++;
        victories[tokenId] = VictoryData({
            difficulty: difficulty,
            totalMoves: totalMoves,
            timeMs: timeMs,
            mintedAt: uint64(block.timestamp)
        });
        _mint(msg.sender, tokenId);

        emit VictoryMinted(msg.sender, tokenId, difficulty, totalMoves, timeMs, token, totalAmount);
    }

    // Views
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(_baseTokenURI, Strings.toString(tokenId), ".json");
    }

    function getVictory(uint256 tokenId) external view returns (VictoryData memory) {
        _requireOwned(tokenId);
        return victories[tokenId];
    }

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    // Internal
    function _normalizePrice(uint256 _priceUsd6, uint8 tokenDecimals) internal pure returns (uint256) {
        if (tokenDecimals >= 6) return _priceUsd6 * 10 ** (tokenDecimals - 6);
        return _priceUsd6 / 10 ** (6 - tokenDecimals);
    }

    function _verifySignature(
        address player, uint8 difficulty, uint16 totalMoves, uint32 timeMs,
        uint256 nonce, uint256 deadline, bytes calldata signature
    ) internal view {
        bytes32 digest = _hashTypedDataV4(
            keccak256(abi.encode(VICTORY_TYPEHASH, player, difficulty, totalMoves, timeMs, nonce, deadline))
        );
        if (ECDSA.recover(digest, signature) != signer) revert InvalidSignature();
    }

    // Admin
    function setPrice(uint8 difficulty, uint256 price) external onlyOwner {
        if (difficulty < 1 || difficulty > 3) revert InvalidDifficulty(difficulty);
        if (price == 0) revert InvalidPrice();
        priceUsd6[difficulty] = price;
        emit PriceUpdated(difficulty, price);
    }

    function setTreasury(address next) external onlyOwner {
        if (next == address(0)) revert InvalidAddress();
        if (next == prizePool) revert SameAddress();
        address prev = treasury;
        treasury = next;
        emit TreasuryUpdated(prev, next);
    }

    function setPrizePool(address next) external onlyOwner {
        if (next == address(0)) revert InvalidAddress();
        if (next == treasury) revert SameAddress();
        address prev = prizePool;
        prizePool = next;
        emit PrizePoolUpdated(prev, next);
    }

    function setSigner(address next) external onlyOwner {
        if (next == address(0)) revert InvalidSigner();
        signer = next;
        emit SignerUpdated(next);
    }

    function setMintCooldown(uint256 seconds_) external onlyOwner {
        mintCooldown = seconds_;
        emit MintCooldownUpdated(seconds_);
    }

    function setAcceptedToken(address token, uint8 decimals) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        if (decimals < 6 || decimals > 18) revert InvalidDecimals();
        acceptedTokens[token] = decimals;
        emit AcceptedTokenUpdated(token, decimals);
    }

    function removeAcceptedToken(address token) external onlyOwner {
        acceptedTokens[token] = 0;
        emit AcceptedTokenRemoved(token);
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}
```

- [ ] **Step 2: Compile contract**

Run: `cd apps/contracts && npx hardhat compile`
Expected: `Compiled 1 Solidity file successfully`

- [ ] **Step 3: Write contract tests**

Create `apps/contracts/test/VictoryNFT.ts` with tests for:
- Mint with valid signature succeeds, stores VictoryData, emits event
- Invalid difficulty (0, 4) reverts with `InvalidDifficulty`
- Zero moves/time reverts
- Expired deadline reverts
- Reused nonce reverts
- Invalid signature reverts
- Unaccepted token reverts
- Price not set reverts
- Cooldown enforced
- Fee split: 80% treasury, 20% prizePool (verify balances)
- Admin functions: setPrice, setTreasury, setPrizePool, setSigner, setMintCooldown
- Treasury/prizePool cannot be same address or address(0)
- Pausable: mint reverts when paused
- tokenURI returns correct format
- getVictory returns stored data
- totalMinted increments correctly

Use `loadFixture` pattern from existing `apps/contracts/test/Badges.ts`. Use a mock ERC20 for payment token.

- [ ] **Step 4: Run contract tests**

Run: `cd apps/contracts && npx hardhat test test/VictoryNFT.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add apps/contracts/contracts/VictoryNFTUpgradeable.sol apps/contracts/test/VictoryNFT.ts
git commit -m "feat(contracts): add VictoryNFTUpgradeable with EIP-712 + fee split

ERC-721 victory NFT contract with multi-token payments, 80/20 fee
split (treasury/prizePool), EIP-712 proof-of-play signatures, mint
cooldown, and pausable admin controls.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 2: Game State Tracking — moveCount + elapsedMs

**Files:**
- Modify: `apps/web/src/lib/game/use-chess-game.ts`

- [ ] **Step 1: Add moveCount and elapsedMs to the hook**

In `useChessGame()`, add:
- `moveCount` state (number) — increment on every successful move (player + AI)
- `elapsedMs` state (number) — start timestamp on `startGame`, compute on terminal status
- `gameStartRef` ref for tracking start time
- Expose both in `ChessGameState` type

Increment `moveCount` in ALL move paths:
- `selectSquare` → after `game.move()` succeeds (player move), +1
- `promoteWith` → after `game.move()` succeeds (promotion move), +1
- `triggerAiMove` → after `game.move()` in AI callback, +1

Compute `elapsedMs` via `useEffect` watching `status`:
- Set `gameStartRef.current = Date.now()` in `startGame`
- Add `useEffect` that fires when status changes to a terminal state (`checkmate`, `stalemate`, `draw`, `resigned`): `setElapsedMs(Date.now() - gameStartRef.current)`
- This is cleaner than computing at each status-change site

Reset both in `reset` and `startGame`.

- [ ] **Step 2: Verify build**

Run: `cd apps/web && npx next build`
Expected: Clean build

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/game/use-chess-game.ts
git commit -m "feat(arena): track moveCount and elapsedMs in chess game hook

Prerequisite for Victory NFT minting — game stats needed for
on-chain data and EIP-712 signature.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 3: Frontend Config — ABI, chains, tokens, editorial

**Files:**
- Create: `apps/web/src/lib/contracts/victory.ts`
- Modify: `apps/web/src/lib/contracts/chains.ts`
- Modify: `apps/web/src/lib/contracts/tokens.ts`
- Modify: `apps/web/src/lib/content/editorial.ts`

- [ ] **Step 1: Create victory.ts with ABI**

Export `victoryAbi` as const array with `mintSigned` function and `VictoryMinted` event. Follow pattern from `badges.ts`.

- [ ] **Step 2: Add getVictoryNFTAddress to chains.ts**

Reuse existing `normalizeAddress` helper (same pattern as `getBadgesAddress`, `getShopAddress`):
```typescript
export function getVictoryNFTAddress(chainId: number | undefined): `0x${string}` | null {
  if (!chainId || chainId !== getConfiguredChainId()) return null;
  return normalizeAddress(process.env.NEXT_PUBLIC_VICTORY_NFT_ADDRESS);
}
```

- [ ] **Step 3: Add VICTORY_PRICES and DIFFICULTY_TO_CHAIN to tokens.ts**

```typescript
import type { ArenaDifficulty } from "@/lib/game/types";

export const DIFFICULTY_TO_CHAIN: Record<ArenaDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3,
};

export const VICTORY_PRICES: Record<number, bigint> = {
  1: 5_000n,   // Easy  — $0.005
  2: 10_000n,  // Medium — $0.01
  3: 20_000n,  // Hard  — $0.02
};
```

Note: `DIFFICULTY_TO_CHAIN` is game logic (not editorial copy), so it lives in tokens.ts alongside pricing. Keys are numeric to match chain difficulty IDs directly.

- [ ] **Step 4: Add VICTORY_MINT_COPY to editorial.ts**

```typescript
export const VICTORY_MINT_COPY = {
  mintButton: "Mint Victory",
  mintedButton: "Victory Minted",
  mintConfirm: "Mint your win as an NFT",
  minting: "Minting...",
  approving: "Approving...",
} as const;
```

- [ ] **Step 5: Update .env.example**

Add `NEXT_PUBLIC_VICTORY_NFT_ADDRESS=` (empty value) to `.env.example` as public reference.

- [ ] **Step 6: Verify build**

Run: `cd apps/web && npx next build`
Expected: Clean build

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/lib/contracts/victory.ts apps/web/src/lib/contracts/chains.ts apps/web/src/lib/contracts/tokens.ts apps/web/src/lib/content/editorial.ts
git commit -m "feat(victory): add ABI, chain config, pricing, and editorial copy

Frontend config for Victory NFT: contract ABI, address resolver,
difficulty-based pricing constants, and UI copy.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 4: API Signing Endpoint

**Files:**
- Create: `apps/web/src/app/api/sign-victory/route.ts`
- Modify: `apps/web/src/lib/server/demo-signing.ts`

- [ ] **Step 1: Add victoryNFTAddress to getDemoConfig**

In `demo-signing.ts`, add to `getDemoConfig()`:
```typescript
const victoryNFTAddress = ethers.getAddress(requireEnv("NEXT_PUBLIC_VICTORY_NFT_ADDRESS"));
```
And add it to the return object: `return { chainId, badgesAddress, scoreboardAddress, victoryNFTAddress, signer };`

- [ ] **Step 2: Create sign-victory API route**

Create `apps/web/src/app/api/sign-victory/route.ts` following the exact pattern from `sign-badge/route.ts`:
- Parse `player` (address), `difficulty` (1-3), `totalMoves` (1-10000), `timeMs` (1-3600000)
- Enforce origin + rate limit
- Sign EIP-712 typed data with domain `{ name: "VictoryNFT", version: "1", chainId, verifyingContract: victoryNFTAddress }`
- Type: `VictoryMint` with fields `(address player, uint8 difficulty, uint16 totalMoves, uint32 timeMs, uint256 nonce, uint256 deadline)`
- Return `{ nonce, deadline, signature }`

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`
Expected: Clean build (route compiles)

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/app/api/sign-victory/route.ts apps/web/src/lib/server/demo-signing.ts
git commit -m "feat(api): add /api/sign-victory endpoint with EIP-712 signing

Server-side proof-of-play signature for Victory NFT minting.
Reuses existing rate limiting, origin enforcement, and signing infra.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 5: Frontend Mint Flow — ArenaEndState + Arena Page

**Files:**
- Modify: `apps/web/src/components/arena/arena-end-state.tsx`
- Modify: `apps/web/src/app/arena/page.tsx`

- [ ] **Step 1: Add mint button to ArenaEndState**

Add props to `ArenaEndState`:
```typescript
type Props = {
  // ...existing
  isPlayerWin: boolean;
  onMintVictory?: () => void;
  isMinting?: boolean;
  hasMinted?: boolean;
  mintPrice?: string;
};
```

When `isPlayerWin && onMintVictory`, show a third button between "Play Again" and "Back to Hub":
```tsx
{isPlayerWin && onMintVictory && (
  <button
    type="button"
    onClick={onMintVictory}
    disabled={isMinting || hasMinted}
    className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 py-2.5 font-semibold text-white shadow-[0_0_16px_rgba(245,158,11,0.3)] transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.5)] active:scale-95 disabled:opacity-50"
  >
    {hasMinted ? VICTORY_MINT_COPY.mintedButton
      : isMinting ? VICTORY_MINT_COPY.minting
      : `${VICTORY_MINT_COPY.mintButton} — ${mintPrice}`}
  </button>
)}
```

- [ ] **Step 2: Wire mint flow in arena/page.tsx**

In `ArenaPage`:
1. Import wallet hooks: `useAccount`, `useChainId`, `useWriteContract`, `useWaitForTransactionReceipt`, `useReadContract`, `useReadContracts`, `usePublicClient`
2. Import: `getVictoryNFTAddress`, `getConfiguredChainId`, `victoryAbi`, `ACCEPTED_TOKENS`, `normalizePrice`, `VICTORY_PRICES`, `DIFFICULTY_TO_CHAIN`, `erc20Abi`
3. Add states: `mintTxHash`, `hasMinted`, `isMinting`, `mintPhase` ("idle" | "signing" | "approving" | "minting")
4. Compute `canMint`: `isConnected && chainId === getConfiguredChainId() && isPlayerWin && victoryNFTAddress != null`
5. Only pass `onMintVictory` to ArenaEndState when `canMint` is true (this enforces `isConnected && isCorrectChain` guard from spec)
6. Add `selectPaymentToken` logic (same as play-hub — read token balances, pick first with sufficient balance)
7. Add `handleMintVictory` async function:
   - Set `isMinting = true`
   - Fetch signature from `/api/sign-victory` with `{ player, difficulty, totalMoves, timeMs }`
   - Auto-select payment token
   - Check allowance, approve if needed
   - Call `mintSigned` on VictoryNFT contract
   - Set `hasMinted = true` on success
   - Handle errors gracefully
6. Pass `onMintVictory`, `isMinting`, `hasMinted`, `mintPrice` to `ArenaEndState`
7. `mintPrice`: format as `$0.01 cUSD` based on difficulty

- [ ] **Step 3: Verify build**

Run: `cd apps/web && npx next build`
Expected: Clean build

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/arena/arena-end-state.tsx apps/web/src/app/arena/page.tsx
git commit -m "feat(arena): add Victory NFT mint button on win

Players can mint their arena victories as ERC-721 NFTs with
difficulty-based micro-fees. Includes payment approval flow,
EIP-712 signature verification, and result overlay.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 6: Deploy Script

**Files:**
- Create: `apps/contracts/scripts/deploy-victory-nft.ts`

- [ ] **Step 1: Write deploy script**

Follow `deploy-shop-upgradeable.ts` pattern:
- Deploy `VictoryNFTUpgradeable` behind TransparentUpgradeableProxy
- Initialize with treasury, prizePool, signer, owner
- Configure accepted tokens (cUSD, USDC, USDT with correct decimals)
- Set prices for each difficulty (5000, 10000, 20000)
- Log proxy, impl, proxyAdmin addresses
- Print env var for frontend: `NEXT_PUBLIC_VICTORY_NFT_ADDRESS=0x...`
- Save to `apps/contracts/deployments/{network}.json`

- [ ] **Step 2: Commit**

```bash
git add apps/contracts/scripts/deploy-victory-nft.ts
git commit -m "feat(contracts): add VictoryNFT deploy script

Deploys VictoryNFTUpgradeable with proxy, configures tokens and
prices, outputs frontend env var.

Wolfcito 🐾 @akawolfcito"
```

---

## Task 7: Testnet Deploy + QA

> **IMPORTANT**: This task requires env vars and testnet access. Do NOT deploy to mainnet.

- [ ] **Step 1: Deploy to Celo Sepolia**

Run: `cd apps/contracts && npx hardhat run scripts/deploy-victory-nft.ts --network celo-sepolia`

- [ ] **Step 2: Add address to .env**

Add `NEXT_PUBLIC_VICTORY_NFT_ADDRESS=0x...` to local `.env` (NEVER commit this)

- [ ] **Step 3: Manual QA checklist**

- [ ] Contract deployed and verified on Celoscan Sepolia
- [ ] Can mint with valid signature on testnet
- [ ] Cannot mint with invalid/expired/reused signature
- [ ] Fee split: verify treasury and prizePool balances after mint
- [ ] Cooldown enforced between mints
- [ ] Frontend: mint button appears only on win
- [ ] Frontend: payment approval + mint tx flow works end-to-end
- [ ] Frontend: "Victory Minted" disabled state after success
- [ ] No secrets visible in UI or console

- [ ] **Step 4: Commit deployment record**

```bash
git add apps/contracts/deployments/celo-sepolia.json
git commit -m "chore(contracts): add VictoryNFT testnet deployment record

Wolfcito 🐾 @akawolfcito"
```

---

## Task 8: Security Review Gate

> **HARD RULE**: No mainnet deploy without passing all 4 steps.

- [ ] **Step 1: Code review** — automated lint + manual review of contract
- [ ] **Step 2: Red team** — check attack vectors: replay, frontrunning, price manipulation, spam
- [ ] **Step 3: QA on Celo Sepolia** — full flow verified (Task 7 Step 3)
- [ ] **Step 4: Final approval** — user signs off before mainnet deploy
