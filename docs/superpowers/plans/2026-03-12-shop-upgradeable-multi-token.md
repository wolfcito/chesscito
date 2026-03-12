# ShopUpgradeable Multi-Token Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the non-upgradeable single-token Shop with an upgradeable multi-token Shop that accepts USDC, USDT, and cUSD.

**Architecture:** Transparent Proxy (matching Scoreboard/Badges pattern). Prices stored in USD with 6 decimals, normalized per token at purchase time. Frontend auto-detects which stablecoin the user holds.

**Tech Stack:** Solidity ^0.8.28, OpenZeppelin Upgradeable contracts, Hardhat + hardhat-upgrades, ethers.js v6, Next.js 14, wagmi/viem

**Spec:** `docs/superpowers/specs/2026-03-12-shop-upgradeable-multi-token.md`

---

## Chunk 1: Contract + Tests

### Task 1: Create MockERC20 with configurable decimals

**Files:**
- Create: `apps/contracts/contracts/mocks/MockERC20.sol`

- [ ] **Step 1: Write MockERC20 contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;

    constructor(string memory name_, string memory symbol_, uint8 decimals_) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/contracts && npx hardhat compile`
Expected: Compiled successfully

- [ ] **Step 3: Commit**

```bash
git add apps/contracts/contracts/mocks/MockERC20.sol
git commit -m "feat(contracts): add MockERC20 with configurable decimals"
```

---

### Task 2: Write ShopUpgradeable contract

**Files:**
- Create: `apps/contracts/contracts/ShopUpgradeable.sol`

- [ ] **Step 1: Write the full contract**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title ShopUpgradeable
 * @notice Players buy in-game items with any accepted ERC-20 stablecoin (USDC, USDT, cUSD).
 *         Prices are stored in USD with 6 decimals and normalized per token at purchase time.
 *         Entitlements are handled off-chain via the `ItemPurchased` event.
 * @dev Deploy behind a TransparentUpgradeableProxy.
 */
contract ShopUpgradeable is
    Initializable,
    OwnableUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    // ─────────────────────────── Errors ────────────────────────────────────
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

    // ─────────────────────────── Events ────────────────────────────────────
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

    // ─────────────────────────── Storage ───────────────────────────────────
    struct ItemConfig {
        uint256 priceUsd6; // price in USD with 6 decimals (e.g. 25000 = $0.025)
        bool enabled;
    }

    // ── Own storage (4 slots) ─────────────────────────────────────────────
    // slot 0: acceptedTokens mapping — decimals per token (0 = not accepted)
    mapping(address => uint8) public acceptedTokens;
    // slot 1: items mapping
    mapping(uint256 => ItemConfig) public items;
    // slot 2: treasury
    address public treasury;
    // slot 3: maxQuantityPerTx
    uint256 public maxQuantityPerTx;

    // ── Gap (46 free = 50 budget − 4 own) ─────────────────────────────────
    uint256[46] private __gap;

    // ─────────────────────────── Constructor ───────────────────────────────
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ─────────────────────────── Initializer ──────────────────────────────
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

    // ─────────────────────────── Purchase ──────────────────────────────────
    function buyItem(uint256 itemId, uint256 quantity, address token) external whenNotPaused nonReentrant {
        if (quantity == 0) revert InvalidQuantity();
        if (maxQuantityPerTx != 0 && quantity > maxQuantityPerTx) {
            revert QuantityExceedsMax(quantity, maxQuantityPerTx);
        }
        if (token == address(0)) revert InvalidAddress();

        uint8 tokenDecimals = acceptedTokens[token];
        if (tokenDecimals == 0) revert TokenNotAccepted(token);

        ItemConfig memory cfg = items[itemId];
        if (cfg.priceUsd6 == 0) revert ItemNotConfigured(itemId);
        if (!cfg.enabled) revert ItemDisabled(itemId);

        uint256 unitAmount = _normalizePrice(cfg.priceUsd6, tokenDecimals);
        uint256 totalAmount = unitAmount * quantity;
        address t = treasury;

        IERC20(token).safeTransferFrom(msg.sender, t, totalAmount);

        emit ItemPurchased(msg.sender, itemId, quantity, cfg.priceUsd6, totalAmount, token, t);
    }

    // ─────────────────────────── Internal ──────────────────────────────────
    /**
     * @notice Convert a USD-6 price to the token's native amount.
     * @dev For tokens with < 6 decimals, integer division truncates.
     *      No current accepted token uses < 6 decimals.
     */
    function _normalizePrice(uint256 priceUsd6, uint8 tokenDecimals) internal pure returns (uint256) {
        if (tokenDecimals >= 6) {
            return priceUsd6 * 10 ** (tokenDecimals - 6);
        }
        return priceUsd6 / 10 ** (6 - tokenDecimals);
    }

    // ─────────────────────────── Admin ─────────────────────────────────────
    function setAcceptedToken(address token, uint8 tokenDecimals) external onlyOwner {
        if (token == address(0)) revert InvalidAddress();
        if (tokenDecimals == 0) revert InvalidDecimals();
        acceptedTokens[token] = tokenDecimals;
        emit AcceptedTokenUpdated(token, tokenDecimals);
    }

    function removeAcceptedToken(address token) external onlyOwner {
        acceptedTokens[token] = 0;
        emit AcceptedTokenRemoved(token);
    }

    function setItem(uint256 itemId, uint256 priceUsd6, bool enabled) external onlyOwner {
        if (priceUsd6 == 0) revert InvalidPrice();
        items[itemId] = ItemConfig({priceUsd6: priceUsd6, enabled: enabled});
        emit ItemConfigured(itemId, priceUsd6, enabled);
    }

    function setItems(
        uint256[] calldata itemIds,
        uint256[] calldata prices,
        bool[] calldata enabledFlags
    ) external onlyOwner {
        if (itemIds.length != prices.length || itemIds.length != enabledFlags.length) {
            revert LengthMismatch();
        }
        for (uint256 i = 0; i < itemIds.length; ) {
            if (prices[i] == 0) revert InvalidPrice();
            items[itemIds[i]] = ItemConfig({priceUsd6: prices[i], enabled: enabledFlags[i]});
            emit ItemConfigured(itemIds[i], prices[i], enabledFlags[i]);
            unchecked { ++i; }
        }
    }

    function disableItem(uint256 itemId) external onlyOwner {
        items[itemId].enabled = false;
        emit ItemConfigured(itemId, items[itemId].priceUsd6, false);
    }

    function setTreasury(address nextTreasury) external onlyOwner {
        if (nextTreasury == address(0)) revert InvalidAddress();
        if (nextTreasury == treasury) revert SameTreasury();
        address prev = treasury;
        treasury = nextTreasury;
        emit TreasuryUpdated(prev, nextTreasury);
    }

    function setMaxQuantityPerTx(uint256 nextMax) external onlyOwner {
        maxQuantityPerTx = nextMax;
        emit MaxQuantityPerTxUpdated(nextMax);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // ─────────────────────────── View helpers ─────────────────────────────
    function getItem(uint256 itemId) external view returns (uint256 priceUsd6, bool enabled) {
        ItemConfig memory cfg = items[itemId];
        return (cfg.priceUsd6, cfg.enabled);
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `cd apps/contracts && npx hardhat compile`
Expected: Compiled successfully

- [ ] **Step 3: Commit**

```bash
git add apps/contracts/contracts/ShopUpgradeable.sol
git commit -m "feat(contracts): add ShopUpgradeable with multi-token support"
```

---

### Task 3: Write ShopUpgradeable test suite

**Files:**
- Create: `apps/contracts/test/ShopUpgradeable.ts`

- [ ] **Step 1: Write the full test file**

```typescript
import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

describe("ShopUpgradeable", function () {
  async function deployFixture() {
    const [owner, buyer, treasury, other] = await ethers.getSigners();

    // Deploy mock tokens: 6-dec (USDC-like), 6-dec (USDT-like), 18-dec (cUSD-like)
    const mockFactory = await ethers.getContractFactory("MockERC20");
    const usdc = await mockFactory.deploy("Mock USDC", "USDC", 6);
    const usdt = await mockFactory.deploy("Mock USDT", "USDT", 6);
    const cusd = await mockFactory.deploy("Mock cUSD", "cUSD", 18);
    await Promise.all([usdc.waitForDeployment(), usdt.waitForDeployment(), cusd.waitForDeployment()]);

    // Deploy ShopUpgradeable via transparent proxy
    const shopFactory = await ethers.getContractFactory("ShopUpgradeable");
    const shop = await upgrades.deployProxy(
      shopFactory,
      [treasury.address, 10n, owner.address],
      { kind: "transparent", initializer: "initialize", initialOwner: owner.address }
    );
    await shop.waitForDeployment();

    // Configure accepted tokens
    await shop.connect(owner).setAcceptedToken(await usdc.getAddress(), 6);
    await shop.connect(owner).setAcceptedToken(await usdt.getAddress(), 6);
    await shop.connect(owner).setAcceptedToken(await cusd.getAddress(), 18);

    // Configure items: Founder Badge = $0.10, Retry Shield = $0.025
    await shop.connect(owner).setItem(1n, 100_000n, true);
    await shop.connect(owner).setItem(2n, 25_000n, true);

    // Mint tokens to buyer
    await usdc.mint(buyer.address, 1_000_000n);        // 1 USDC
    await usdt.mint(buyer.address, 1_000_000n);        // 1 USDT
    await cusd.mint(buyer.address, ethers.parseEther("1")); // 1 cUSD

    return { owner, buyer, treasury, other, usdc, usdt, cusd, shop };
  }

  // ── Purchase with 6-decimal token ────────────────────────────────────
  describe("buyItem with 6-decimal token", function () {
    it("transfers correct amount to treasury", async function () {
      const { buyer, treasury, usdc, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();

      await usdc.connect(buyer).approve(shopAddr, 100_000n);
      await shop.connect(buyer).buyItem(1n, 1n, await usdc.getAddress());

      expect(await usdc.balanceOf(treasury.address)).to.equal(100_000n);
    });

    it("transfers correct amount for quantity > 1", async function () {
      const { buyer, treasury, usdt, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();

      // 2x Retry Shield = 2 * 25000 = 50000
      await usdt.connect(buyer).approve(shopAddr, 50_000n);
      await shop.connect(buyer).buyItem(2n, 2n, await usdt.getAddress());

      expect(await usdt.balanceOf(treasury.address)).to.equal(50_000n);
    });

    it("emits ItemPurchased with correct values", async function () {
      const { buyer, treasury, usdc, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();
      const usdcAddr = await usdc.getAddress();

      await usdc.connect(buyer).approve(shopAddr, 100_000n);

      await expect(shop.connect(buyer).buyItem(1n, 1n, usdcAddr))
        .to.emit(shop, "ItemPurchased")
        .withArgs(buyer.address, 1n, 1n, 100_000n, 100_000n, usdcAddr, treasury.address);
    });
  });

  // ── Purchase with 18-decimal token ───────────────────────────────────
  describe("buyItem with 18-decimal token (cUSD)", function () {
    it("normalizes price correctly (priceUsd6 * 10^12)", async function () {
      const { buyer, treasury, cusd, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();

      // Item 2 = 25000 (usd6) → 25000 * 10^12 = 25_000_000_000_000_000 in 18-dec
      const expected = 25_000n * 10n ** 12n;
      await cusd.connect(buyer).approve(shopAddr, expected);
      await shop.connect(buyer).buyItem(2n, 1n, await cusd.getAddress());

      expect(await cusd.balanceOf(treasury.address)).to.equal(expected);
    });
  });

  // ── Rejection cases ──────────────────────────────────────────────────
  describe("reverts", function () {
    it("rejects unaccepted token", async function () {
      const { buyer, shop } = await loadFixture(deployFixture);
      const mockFactory = await ethers.getContractFactory("MockERC20");
      const rogue = await mockFactory.deploy("Rogue", "RGE", 6);
      await rogue.waitForDeployment();

      await expect(
        shop.connect(buyer).buyItem(1n, 1n, await rogue.getAddress())
      ).to.be.revertedWithCustomError(shop, "TokenNotAccepted");
    });

    it("rejects token address(0)", async function () {
      const { buyer, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).buyItem(1n, 1n, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(shop, "InvalidAddress");
    });

    it("rejects disabled item", async function () {
      const { owner, buyer, usdc, shop } = await loadFixture(deployFixture);
      await shop.connect(owner).disableItem(1n);

      await expect(
        shop.connect(buyer).buyItem(1n, 1n, await usdc.getAddress())
      ).to.be.revertedWithCustomError(shop, "ItemDisabled");
    });

    it("rejects unconfigured item", async function () {
      const { buyer, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).buyItem(99n, 1n, await usdc.getAddress())
      ).to.be.revertedWithCustomError(shop, "ItemNotConfigured");
    });

    it("rejects zero quantity", async function () {
      const { buyer, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).buyItem(1n, 0n, await usdc.getAddress())
      ).to.be.revertedWithCustomError(shop, "InvalidQuantity");
    });

    it("rejects quantity exceeding max", async function () {
      const { buyer, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).buyItem(1n, 11n, await usdc.getAddress())
      ).to.be.revertedWithCustomError(shop, "QuantityExceedsMax");
    });

    it("rejects insufficient allowance", async function () {
      const { buyer, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).buyItem(1n, 1n, await usdc.getAddress())
      ).to.be.reverted; // SafeERC20 reverts
    });

    it("rejects insufficient balance", async function () {
      const { other, usdc, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();
      await usdc.connect(other).approve(shopAddr, 100_000n);

      await expect(
        shop.connect(other).buyItem(1n, 1n, await usdc.getAddress())
      ).to.be.reverted; // SafeERC20 reverts
    });
  });

  // ── Admin functions ──────────────────────────────────────────────────
  describe("admin", function () {
    it("owner can add accepted token", async function () {
      const { owner, shop } = await loadFixture(deployFixture);
      const mockFactory = await ethers.getContractFactory("MockERC20");
      const newToken = await mockFactory.deploy("New", "NEW", 8);
      await newToken.waitForDeployment();
      const addr = await newToken.getAddress();

      await expect(shop.connect(owner).setAcceptedToken(addr, 8))
        .to.emit(shop, "AcceptedTokenUpdated")
        .withArgs(addr, 8);

      expect(await shop.acceptedTokens(addr)).to.equal(8);
    });

    it("rejects setAcceptedToken with decimals=0", async function () {
      const { owner, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(owner).setAcceptedToken(await usdc.getAddress(), 0)
      ).to.be.revertedWithCustomError(shop, "InvalidDecimals");
    });

    it("rejects setAcceptedToken with address(0)", async function () {
      const { owner, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(owner).setAcceptedToken(ethers.ZeroAddress, 6)
      ).to.be.revertedWithCustomError(shop, "InvalidAddress");
    });

    it("owner can remove accepted token", async function () {
      const { owner, usdc, shop } = await loadFixture(deployFixture);
      const addr = await usdc.getAddress();

      await expect(shop.connect(owner).removeAcceptedToken(addr))
        .to.emit(shop, "AcceptedTokenRemoved")
        .withArgs(addr);

      expect(await shop.acceptedTokens(addr)).to.equal(0);
    });

    it("re-adding a previously removed token works", async function () {
      const { owner, buyer, treasury, usdc, shop } = await loadFixture(deployFixture);
      const addr = await usdc.getAddress();
      const shopAddr = await shop.getAddress();

      await shop.connect(owner).removeAcceptedToken(addr);
      await shop.connect(owner).setAcceptedToken(addr, 6);

      await usdc.connect(buyer).approve(shopAddr, 25_000n);
      await shop.connect(buyer).buyItem(2n, 1n, addr);

      expect(await usdc.balanceOf(treasury.address)).to.equal(25_000n);
    });

    it("rejects setTreasury to address(0)", async function () {
      const { owner, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(owner).setTreasury(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(shop, "InvalidAddress");
    });

    it("rejects setTreasury to same address", async function () {
      const { owner, treasury, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(owner).setTreasury(treasury.address)
      ).to.be.revertedWithCustomError(shop, "SameTreasury");
    });

    it("disableItem delists without changing price", async function () {
      const { owner, shop } = await loadFixture(deployFixture);

      await shop.connect(owner).disableItem(1n);
      const [price, enabled] = await shop.getItem(1n);

      expect(price).to.equal(100_000n);
      expect(enabled).to.equal(false);
    });

    it("non-owner cannot call admin functions", async function () {
      const { buyer, usdc, shop } = await loadFixture(deployFixture);

      await expect(
        shop.connect(buyer).setAcceptedToken(await usdc.getAddress(), 6)
      ).to.be.reverted;

      await expect(shop.connect(buyer).setItem(3n, 50_000n, true)).to.be.reverted;
      await expect(shop.connect(buyer).setTreasury(buyer.address)).to.be.reverted;
      await expect(shop.connect(buyer).pause()).to.be.reverted;
    });
  });

  // ── Pause ────────────────────────────────────────────────────────────
  describe("pause", function () {
    it("blocks purchases when paused", async function () {
      const { owner, buyer, usdc, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();

      await shop.connect(owner).pause();
      await usdc.connect(buyer).approve(shopAddr, 100_000n);

      await expect(
        shop.connect(buyer).buyItem(1n, 1n, await usdc.getAddress())
      ).to.be.reverted;
    });

    it("resumes purchases after unpause", async function () {
      const { owner, buyer, treasury, usdc, shop } = await loadFixture(deployFixture);
      const shopAddr = await shop.getAddress();

      await shop.connect(owner).pause();
      await shop.connect(owner).unpause();

      await usdc.connect(buyer).approve(shopAddr, 100_000n);
      await shop.connect(buyer).buyItem(1n, 1n, await usdc.getAddress());

      expect(await usdc.balanceOf(treasury.address)).to.equal(100_000n);
    });
  });

  // ── Upgrade ──────────────────────────────────────────────────────────
  describe("proxy upgrade", function () {
    it("preserves state after upgrade", async function () {
      const { owner, shop } = await loadFixture(deployFixture);

      // Read state before upgrade
      const [priceBefore, enabledBefore] = await shop.getItem(1n);

      // Upgrade to same implementation (simulates upgrade)
      const shopV2Factory = await ethers.getContractFactory("ShopUpgradeable");
      const upgraded = await upgrades.upgradeProxy(await shop.getAddress(), shopV2Factory);

      // Verify state preserved
      const [priceAfter, enabledAfter] = await upgraded.getItem(1n);
      expect(priceAfter).to.equal(priceBefore);
      expect(enabledAfter).to.equal(enabledBefore);
    });
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd apps/contracts && npx hardhat test test/ShopUpgradeable.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add apps/contracts/test/ShopUpgradeable.ts
git commit -m "test(contracts): add ShopUpgradeable test suite (21 cases)"
```

---

## Chunk 2: Deployment Script

### Task 4: Write deployment script

**Files:**
- Create: `apps/contracts/scripts/deploy-shop-upgradeable.ts`

- [ ] **Step 1: Write the deployment script**

Following the `deploy-proxies.ts` pattern exactly:

```typescript
import fs from "node:fs/promises";
import path from "node:path";

import { ethers, network, upgrades } from "hardhat";

// Celo Mainnet stablecoin addresses
const CELO_TOKENS: Record<string, { address: string; decimals: number }> = {
  USDC: { address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C", decimals: 6 },
  USDT: { address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", decimals: 6 },
  cUSD: { address: "0x765DE816845861e75A25fCA122bb6898B8B1282a", decimals: 18 },
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function main() {
  const safeOwner = ethers.getAddress(requireEnv("SAFE_OWNER"));
  const treasuryAddress = ethers.getAddress(process.env.SHOP_TREASURY ?? safeOwner);
  const maxQuantityPerTx = BigInt(process.env.MAX_QUANTITY_PER_TX ?? "10");
  const [deployer] = await ethers.getSigners();
  const { chainId } = await ethers.provider.getNetwork();

  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Safe owner: ${safeOwner}`);
  console.log(`Treasury: ${treasuryAddress}`);

  // Deploy proxy
  const shopFactory = await ethers.getContractFactory("ShopUpgradeable");
  const shop = await upgrades.deployProxy(
    shopFactory,
    [treasuryAddress, maxQuantityPerTx, safeOwner],
    { kind: "transparent", initializer: "initialize", initialOwner: safeOwner }
  );
  await shop.waitForDeployment();

  const shopProxy = await shop.getAddress();
  const shopImpl = await upgrades.erc1967.getImplementationAddress(shopProxy);
  const shopProxyAdmin = await upgrades.erc1967.getAdminAddress(shopProxy);

  console.log(`\nShop proxy: ${shopProxy}`);
  console.log(`Shop implementation: ${shopImpl}`);
  console.log(`Shop ProxyAdmin: ${shopProxyAdmin}`);

  // Configure accepted tokens (only on mainnet/known networks)
  if (Number(chainId) === 42220) {
    console.log("\nConfiguring accepted tokens for Celo Mainnet...");
    for (const [symbol, { address, decimals }] of Object.entries(CELO_TOKENS)) {
      const tx = await shop.setAcceptedToken(address, decimals);
      await tx.wait();
      console.log(`  ${symbol}: ${address} (${decimals} decimals)`);
    }
  }

  // Configure items: Founder Badge = $0.10, Retry Shield = $0.025
  console.log("\nConfiguring items...");
  const tx1 = await shop.setItem(1n, 100_000n, true);
  await tx1.wait();
  console.log("  Item 1 (Founder Badge): $0.10");

  const tx2 = await shop.setItem(2n, 25_000n, true);
  await tx2.wait();
  console.log("  Item 2 (Retry Shield): $0.025");

  // Append to existing deployment record
  const outputDir = path.join(process.cwd(), "deployments");
  const outputFile = path.join(outputDir, `${network.name}.json`);
  await fs.mkdir(outputDir, { recursive: true });

  let record: Record<string, unknown> = {};
  try {
    const existing = await fs.readFile(outputFile, "utf8");
    record = JSON.parse(existing);
  } catch {
    // No existing file — start fresh
    record = { network: network.name, chainId: Number(chainId) };
  }

  record.shopProxy = shopProxy;
  record.shopImpl = shopImpl;
  record.shopProxyAdmin = shopProxyAdmin;
  record.shopDeployedAt = new Date().toISOString();

  await fs.writeFile(outputFile, `${JSON.stringify(record, null, 2)}\n`, "utf8");

  console.log(`\nDeployment record updated: deployments/${network.name}.json`);
  console.log("\nFrontend env:");
  console.log(`NEXT_PUBLIC_SHOP_ADDRESS=${shopProxy}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Verify script compiles (typecheck)**

Run: `cd apps/contracts && npx tsc --noEmit`
Expected: No errors (or only pre-existing ones)

- [ ] **Step 3: Commit**

```bash
git add apps/contracts/scripts/deploy-shop-upgradeable.ts
git commit -m "feat(contracts): add ShopUpgradeable deployment script"
```

---

## Chunk 3: Frontend Integration

### Task 5: Add token registry and update shop ABI

**Files:**
- Create: `apps/web/src/lib/contracts/tokens.ts`
- Modify: `apps/web/src/lib/contracts/shop.ts`

- [ ] **Step 1: Create token registry with normalizePrice**

Create `apps/web/src/lib/contracts/tokens.ts`:

```typescript
import { erc20Abi } from "viem";

export const ACCEPTED_TOKENS = [
  { symbol: "USDC", address: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const, decimals: 6 },
  { symbol: "USDT", address: "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const, decimals: 6 },
  { symbol: "cUSD", address: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const, decimals: 18 },
] as const;

/** Convert priceUsd6 to token amount (mirrors contract _normalizePrice). */
export function normalizePrice(priceUsd6: bigint, tokenDecimals: number): bigint {
  if (tokenDecimals >= 6) {
    return priceUsd6 * 10n ** BigInt(tokenDecimals - 6);
  }
  return priceUsd6 / 10n ** BigInt(6 - tokenDecimals);
}

/** Format priceUsd6 as a human-readable USD string (e.g. 25000 → "$0.03"). */
export function formatUsd(priceUsd6: bigint): string {
  const dollars = Number(priceUsd6) / 1_000_000;
  return `$${dollars.toFixed(2)}`;
}

export { erc20Abi };
```

- [ ] **Step 2: Update shop.ts ABI**

Replace the `buyItem` inputs in `apps/web/src/lib/contracts/shop.ts` to include the `token` parameter:

```typescript
export const shopAbi = [
  {
    type: "function",
    stateMutability: "view",
    name: "getItem",
    inputs: [{ name: "itemId", type: "uint256" }],
    outputs: [
      { name: "priceUsd6", type: "uint256" },
      { name: "enabled", type: "bool" },
    ],
  },
  {
    type: "function",
    stateMutability: "nonpayable",
    name: "buyItem",
    inputs: [
      { name: "itemId", type: "uint256" },
      { name: "quantity", type: "uint256" },
      { name: "token", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    stateMutability: "view",
    name: "acceptedTokens",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ name: "decimals", type: "uint8" }],
  },
  {
    type: "event",
    anonymous: false,
    name: "ItemPurchased",
    inputs: [
      { indexed: true, name: "buyer", type: "address" },
      { indexed: true, name: "itemId", type: "uint256" },
      { indexed: false, name: "quantity", type: "uint256" },
      { indexed: false, name: "unitPriceUsd6", type: "uint256" },
      { indexed: false, name: "totalTokenAmount", type: "uint256" },
      { indexed: true, name: "token", type: "address" },
      { indexed: false, name: "treasury", type: "address" },
    ],
  },
] as const;
```

Keep `getLevelId` as-is.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/contracts/tokens.ts apps/web/src/lib/contracts/shop.ts
git commit -m "feat(web): add token registry and update shop ABI for multi-token"
```

---

### Task 6: Update purchase flow in page.tsx

**Files:**
- Modify: `apps/web/src/app/play-hub/page.tsx`

This is the most complex task. The changes are:

1. **Replace single USDC allowance read** with batch balance reads for all 3 tokens
2. **Auto-select token** with sufficient balance when user clicks buy
3. **Pass token address** to `buyItem` call
4. **Approve on selected token** instead of hardcoded USDC

- [ ] **Step 1: Add imports**

At the top of the file, add:

```typescript
import { ACCEPTED_TOKENS, normalizePrice } from "@/lib/contracts/tokens";
```

- [ ] **Step 2: Replace single USDC allowance with multi-token balance reads**

Find the `useReadContract` for `usdcAllowance` (around line 257-265) and replace it with a batch read of balances for all accepted tokens, plus the allowance for the selected token.

Add state for selected payment token:

```typescript
const [paymentToken, setPaymentToken] = useState<typeof ACCEPTED_TOKENS[number] | null>(null);
```

Add batch balance read:

```typescript
const { data: tokenBalances } = useReadContracts({
  contracts: ACCEPTED_TOKENS.map((t) => ({
    address: t.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId,
  })),
  allowFailure: true,
  query: { enabled: Boolean(address) },
});
```

Add allowance read for the selected payment token:

```typescript
const { data: paymentAllowance } = useReadContract({
  address: paymentToken?.address,
  abi: erc20Abi,
  functionName: "allowance",
  args: address && shopAddress ? [address, shopAddress] : undefined,
  chainId,
  query: { enabled: Boolean(address && shopAddress && paymentToken) },
});
```

- [ ] **Step 3: Add auto-select logic**

Add a function that picks the best token when the user opens the confirm sheet:

```typescript
function selectPaymentToken(priceUsd6: bigint) {
  if (!tokenBalances) return null;

  for (let i = 0; i < ACCEPTED_TOKENS.length; i++) {
    const t = ACCEPTED_TOKENS[i];
    const result = tokenBalances[i];
    if (result?.status !== "success") continue;
    const balance = result.result as bigint;
    const needed = normalizePrice(priceUsd6, t.decimals);
    if (balance >= needed) return t;
  }
  return null;
}
```

Call this when opening the confirm sheet and set `paymentToken`.

- [ ] **Step 4: Update handleConfirmPurchase**

In `handleConfirmPurchase`, replace the hardcoded USDC approve + `buyItem(itemId, 1n)` with:

```typescript
// Use paymentToken instead of usdcAddress
if (!paymentToken) {
  setLastError("No accepted token with sufficient balance");
  return;
}

const normalizedTotal = normalizePrice(unitPrice, paymentToken.decimals);

// Approve on the selected token
if (!paymentAllowance || paymentAllowance < normalizedTotal) {
  setPurchasePhase("approving");
  const approveHash = await writeWithOptionalFeeCurrency({
    address: paymentToken.address,
    abi: erc20Abi,
    functionName: "approve" as const,
    args: [shopAddress, normalizedTotal] as const,
    chainId,
    account: address,
  });
  // ... wait for receipt (same as current)
}

// Buy with token address
setPurchasePhase("buying");
const buyHash = await writeWithOptionalFeeCurrency({
  address: shopAddress,
  abi: shopAbi,
  functionName: "buyItem" as const,
  args: [selectedItem.itemId, 1n, paymentToken.address] as const,
  chainId,
  account: address,
});
```

- [ ] **Step 5: Verify it compiles**

Run: `cd apps/web && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/play-hub/page.tsx
git commit -m "feat(play-hub): wire multi-token purchase flow"
```

---

## Chunk 4: Security Review + Deploy

### Task 7: Security review gate

- [ ] **Step 1: Run Slither static analysis**

Run: `cd apps/contracts && slither contracts/ShopUpgradeable.sol`
Expected: Resolve all high/medium findings

- [ ] **Step 2: Code review**

Dispatch `superpowers:code-reviewer` agent focused on:
- Access control (all admin functions onlyOwner)
- Reentrancy (ReentrancyGuardUpgradeable + CEI pattern)
- Token handling (SafeERC20, no raw transfer)
- Upgrade safety (gap slots, _disableInitializers)
- Decimal normalization edge cases

- [ ] **Step 3: Deploy to Celo Sepolia testnet**

```bash
cd apps/contracts && npx hardhat run scripts/deploy-shop-upgradeable.ts --network celo-sepolia
```

- [ ] **Step 4: Verify on testnet in MiniPay**

Update `NEXT_PUBLIC_SHOP_ADDRESS` in Vercel preview env, test purchase flow with test tokens.

- [ ] **Step 5: Deploy to Celo Mainnet**

```bash
cd apps/contracts && npx hardhat run scripts/deploy-shop-upgradeable.ts --network celo
```

- [ ] **Step 6: Update production env**

Set `NEXT_PUBLIC_SHOP_ADDRESS` in Vercel production environment to the new proxy address.

- [ ] **Step 7: Commit deployment record**

```bash
git add apps/contracts/deployments/celo.json
git commit -m "chore(contracts): record ShopUpgradeable mainnet deployment"
```

- [ ] **Step 8: Verify in MiniPay production**

Test a purchase with USDT or cUSD (not just USDC) to confirm multi-token works end-to-end.
