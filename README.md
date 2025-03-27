# Pokemon Card Trading dApp

This project was developed for my DeFi course at ETH. It features a Pokemon card trading platform built on Ethereum that combines ERC-721 NFTs with a full-featured decentralized marketplace. The application includes both frontend and backend components, allowing users to collect, buy, sell, and auction Pokemon cards through a modern React interface. The project provides instructions and scripts to automatically deploy the contracts on a local testnet or on Sepolia (and even on Ethereum Mainnet with minor adjustments).

## Project Overview

The Pokemon Card Trading dApp consists of:

1. **Smart Contracts**: ERC-721 token and marketplace contracts built with Solidity
2. **Frontend Application**: React-based UI built with Vite and TailwindCSS
3. **Integration Layer**: ethers.js for blockchain communication
4. **External Data**: Pokemon data from PokeAPI

The project provides easy deployment to both local development environments and public testnets like Sepolia.

## Features

- **NFT Functionality**: Mint Pokemon cards as NFTs with varying rarities
- **Marketplace**: Buy, sell, and auction Pokemon cards
- **Wallet Integration**: Connect with MetaMask or other Ethereum wallets
- **Collection Management**: View and manage your card collection
- **Responsive Design**: Full functionality on desktop and mobile devices
- **Type-based Filtering**: Filter cards by Pokemon type, rarity and more
- **Local testnet scripts**: Test contract functionality without deploying
- **Development Mode**: Test frontend features without a blockchain connection

## Quick Start

### Automatic Local Contract Deployment

#### For Linux

```bash
# Make the script executable
chmod +x deploy-local.sh

# Run the deployment script
./deploy-local.sh

# OR use npm script
npm run deploy:local
```

### Automatic Sepolia Testnet Contract Deployment

#### For Linux:

```bash
# Make the script executable
chmod +x deploy-sepolia.sh

# Run the deployment script
./deploy-sepolia.sh

# OR use npm script
npm run deploy:sepolia
```

### Automatic Frontend Deployment

#### For Linux:

```bash
cd frontend

chmod +x deploy-frontend.sh

./deploy-frontend.sh
```

If you want to switch networks without deploying the backend again, you must edit the .env file yourself or simply delete it.


### Manual Deployment (Linux)

If you prefer to deploy the contracts manually, follow these steps:

```bash
# Install dependencies
npm install

# Compile the contracts
npx hardhat compile

# Start a local Hardhat node (for local development)
npx hardhat node

# In a new terminal, deploy to local network
npx hardhat run scripts/deploy.js --network localhost

# OR deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment, the contract addresses will be displayed in the terminal. Save these addresses for frontend configuration:

```bash
# Move to the frontend directory
cd frontend

# Edit the .env file with your contract addresses
nano .env
# Add the following lines:
# VITE_TOKEN_CONTRACT_ADDRESS=<your-token-contract-address>
# VITE_TRADING_CONTRACT_ADDRESS=<your-trading-contract-address>

# Install frontend dependencies
npm install

# Start the development server
npm run dev

# OR build for production
npm run build
npm run serve
```

## Technical Architecture

### Smart Contracts

Two primary smart contracts handle the core functionality:

1. **PokemonCardToken.sol**: ERC-721 NFT implementation
   
   - Minting of Pokemon cards with unique attributes
   - Ownership tracking and transfer capabilities
   - Metadata storage for Pokemon ID and rarity
2. **PokemonCardTrading.sol**: Marketplace contract
   
   - Fixed-price listings
   - Time-limited auctions
   - Secure escrow for listed cards
   - Withdrawal system for sellers

Both contracts use OpenZeppelin libraries for security and standard compliance.

### Frontend Architecture

The frontend is built with a component-based architecture centered around React:

#### State Management

- **Context API**: Global state management using React Context
- **Component-Level State**: Local state for UI components
- **Custom Hooks**: Reusable logic encapsulation

## Project Structure

```
pokemon-card-nft/
├── contracts/                  # Solidity smart contracts
│   ├── PokemonCardToken.sol    # ERC-721 NFT contract
│   └── PokemonCardTrading.sol  # Marketplace contract
├── frontend/                   # React frontend application
│   ├── public/                 # Static assets
│   ├── src/                    # Source code
│   │   ├── components/         # React components
│   │   ├── contexts/           # Context providers
│   │   ├── contracts/          # Contract ABI's
│   │   ├── pages/              # Page components
│   │   ├── providers/          # App providers
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main application
│   │   └── main.jsx            # Entry point
│   ├── .env.example            # Environment variables template
│   ├── deploy-frontend.sh      # Frontend deployment script
│   └── package.json            # Frontend dependencies
├── scripts/                    # Deployment scripts
├── test/                       # Contract test scripts
├── hardhat.config.js           # Hardhat configuration
├── package.json                # Project dependencies
├── README.md                   # This document
└── various deployment scripts  # For different needs
```

## Smart Contract Features

### PokemonCardToken

- **ERC-721 Standard**: Fully compliant with ERC-721 NFT standard
- **Card Attributes**: Each card has a Pokemon ID (1-151) and rarity level
- **Access Control**: Only contract owner can mint new cards
- **Events**: Comprehensive event emission for all actions

### PokemonCardTrading

- **Marketplace Features**: Fixed-price listings and auctions
- **Security**: Reentrancy protection and escrow pattern
- **Withdrawal System**: Secure fund withdrawal for sellers
- **Auction Mechanics**: Bidding, automatic time extension, and finalization
- **Listing Management**: Create, cancel, and fulfill listings

## Frontend Features

- **Wallet Connection**: Easy connection to MetaMask or other Ethereum wallets
- **Card Display**: Visual representation of Pokemon cards with type information
- **Collection View**: Personal collection management
- **Marketplace**: Browse, buy, and bid on listed cards
- **Selling Interface**: List cards for fixed price or auction
- **Card Filtering**: Filter cards by Pokemon type, rarity and more
- **Responsive Design**: Works well on all device sizes

## Testing Features

### Contract Test Scripts

After deploying the contracts locally, you can execute test scripts that will check all the functionalities of the contracts. (If the frontend is running, you can directly view the cards and listings that are created by them)

```
npx hardhat run test/mint-test.js --network localhost
npx hardhat run test/fixed-price-test.js --network localhost
npx hardhat run test/auction-test.js --network localhost
npx hardhat run test/comprehensive-test.js --network localhost
```

### Explicit Testing

For more granular testing, connect your wallet to the frontend after deploying locally. Make sure to switch your wallet to the correct local network and use either the private key provided by the deploy-local script or one from the generated hardhat_node.log file to interact with the contracts directly.

### Frontend Dev Mode

The application includes robust development features to help test and debug:

- **Mock Data**: Auto-generated data when contract calls fail
- **Contract Status**: Display of connection status
- **Diagnostic Tools**: Built-in troubleshooting tools

To use development mode:

1. Start frontend with `npm run dev`
2. Use diagnostic tools for contract connectivity issues
3. Check functionality with mock data

## Security Considerations

The contracts implement several best practices:

- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Access Control**: Proper role-based access control
- **Escrow Pattern**: Secure handling of listed NFTs
- **Withdrawal Pattern**: Prevents reentrancy attacks
- **Event Emissions**: Complete audit trail via events

## Common Issues

- **MetaMask not detecting**: Ensure extension is installed and unlocked
- **Wrong network**: Switch to the correct network in MetaMask
- **Invalid contract addresses**: Double-check `.env` file

## Etherscan Verification

Contract verification on Etherscan is automatic with proper setup. If it fails:

```bash
# Verify token contract
npx hardhat verify --network sepolia YOUR_TOKEN_ADDRESS

# Verify trading contract
npx hardhat verify --network sepolia YOUR_TRADING_ADDRESS YOUR_TOKEN_ADDRESS
```

## Technologies Used

- **Blockchain**: Ethereum, Hardhat, Sepolia Testnet
- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin
- **Frontend**: React 18, Vite, TailwindCSS
- **Blockchain Interaction**: ethers.js 6
- **External Data**: PokeAPI

## License

This project is licensed under the MIT License - see the LICENSE file for details.

