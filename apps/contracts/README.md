# chesscito - Smart Contracts

This directory contains the smart contracts for chesscito, built with Hardhat and optimized for the Celo blockchain.

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Celo Sepolia Testnet
pnpm deploy:celo-sepolia

# Deploy to Celo Mainnet
pnpm deploy:celo
```

## 📜 Available Scripts

- `pnpm compile` - Compile smart contracts
- `pnpm test` - Run contract tests
- `pnpm deploy` - Deploy to local network
- `pnpm deploy:celo-sepolia` - Deploy to Celo Sepolia Testnet
- `pnpm deploy:celo` - Deploy to Celo Mainnet
- `pnpm verify` - Verify contracts on Etherscan
- `pnpm clean` - Clean artifacts and cache

## 🌐 Networks

### Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Explorer**: https://celoscan.io

### Celo Sepolia Testnet
- **Chain ID**: 11142220
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org/
- **Explorer**: https://sepolia.celoscan.io/
- **Faucet**: https://faucet.celo.org/celo-sepolia


## 🔧 Environment Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your private key and API keys:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

## 📁 Project Structure

```
contracts/          # Smart contract source files
├── Lock.sol        # Sample timelock contract

test/              # Contract tests
├── Lock.ts        # Tests for Lock contract

ignition/          # Deployment scripts
└── modules/
    └── Lock.ts    # Lock contract deployment

hardhat.config.ts  # Hardhat configuration
tsconfig.json      # TypeScript configuration
```

## 🔐 Security Notes

- Never commit your `.env` file with real private keys
- Use a dedicated wallet for development/testing
- Test thoroughly on Celo Sepolia Testnet before CeloMainnet deployment
- Consider using a hardware wallet for mainnet deployments

## 📚 Learn More

- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Documentation](https://docs.celo.org)
- [Viem Documentation](https://viem.sh) (Ethereum library used by Hardhat)
