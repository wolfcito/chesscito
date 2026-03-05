# chesscito - Smart Contracts

This package contains the on-chain proof layer for Chesscito on Celo.

## Contracts

- `ScoreboardUpgradeable.sol`: EIP-712 signed score submission with anti-spam controls
- `BadgesUpgradeable.sol`: EIP-712 signed ERC-1155 badge claims (one mint per wallet and level)

## Local workflow

```bash
pnpm --filter hardhat compile
pnpm --filter hardhat test
```

## Deploy

```bash
pnpm --filter hardhat deploy
pnpm --filter hardhat deploy:alfajores
pnpm --filter hardhat deploy:celo-sepolia
pnpm --filter hardhat deploy:celo
pnpm --filter hardhat verify:alfajores
pnpm --filter hardhat verify:celo-sepolia
pnpm --filter hardhat verify:celo
```

Default deploy parameters:
- `submitCooldown=60`
- `maxSubmissionsPerDay=25`
- `initialOwner=SAFE_OWNER`
- `baseURI=ipfs://chesscito/badges`
- `kind=transparent`

## Environment

Copy `.env.example` to `.env` and fill only what you need:

```env
DEPLOYER_PRIVATE_KEY=your_private_key_with_0x_prefix
SIGNER_PRIVATE_KEY=server_signer_private_key_with_0x_prefix
SAFE_OWNER=0xYourSafeAddress
ALFAJORES_RPC_URL=https://alfajores-forno.celo-testnet.org
CELO_SEPOLIA_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_RPC_URL=https://forno.celo.org
CELOSCAN_API_KEY=your_celoscan_api_key
```

## Notes

- Never commit `.env` with real keys
- Current recommended Celo testnet flow is Celo Sepolia
- Deploy writes `deployments/<network>.json` with proxy and implementation addresses
- The Scoreboard contract emits `ScoreSubmitted` and enforces cooldown/max submissions/day with signed payloads
- The Badges contract exposes `claimBadgeSigned(levelId, nonce, deadline, signature)` and serves `baseURI + tokenId + .json`
