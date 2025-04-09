# Pokemon Card Trading dApp

This project was developed for my DeFi course at ETH. It features a Pokemon card trading platform built on Ethereum that combines ERC-721 NFTs with a full-featured decentralized marketplace. The application includes both frontend and backend components, allowing users to collect, buy, sell, and auction Pokemon cards through a modern React interface. The project provides instructions and scripts to automatically deploy the contracts on a local testnet or on Sepolia (and even on Ethereum Mainnet with minor adjustments).

## Project Overview

The Pokemon Card Trading dApp consists of:

1. **Smart Contracts**: ERC-721 token and marketplace contracts built with Solidity.
2. **Frontend Application**: React-based UI built with Vite and Tailwind CSS.
3. **Integration Layer**: ethers.js for blockchain communication.
4. **External Data**: Pokemon data from PokeAPI.

The project provides easy deployment to both local development environments and public testnets like Sepolia.

## Features

- **NFT Functionality**: Mint Pokemon cards as NFTs with varying rarities.
- **Marketplace**: Buy, sell, and auction Pokemon cards.
- **Pausable Trading**: Emergency stop functionality for marketplace operations.
- **Wallet Integration**: Connect directly with MetaMask.
- **Collection Management**: View and manage your card collection.
- **Responsive Design**: Full functionality on desktop and mobile devices.
- **Type-based Filtering**: Filter cards by Pokemon type, rarity, and more.
- **Local Testnet Scripts**: Test contract functionality without deploying.
- **Development Mode**: Test frontend features without a blockchain connection.

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

**Prerequisites:**

*   **RPC URL:** You need an RPC URL for the Sepolia testnet from a provider like [Infura](https://infura.io/) or [Alchemy](https://www.alchemy.com/). The script will prompt you for this.
*   **Private Key:** A wallet private key with sufficient Sepolia ETH to cover deployment gas fees. The script will prompt you for this.
*   **Etherscan API Key (Optional):** For automatic contract verification on Etherscan, you'll need an API key from [Etherscan](https://etherscan.io/). The script will prompt for this, but you can skip it.

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

If you want to switch networks without deploying the backend again, you must edit the `.env` file yourself or simply delete it.


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
# Ensure your .env file has SEPOLIA_RPC_URL and PRIVATE_KEY defined
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

1. **PokemonCardToken.sol**: Implements the ERC-721 NFT standard using OpenZeppelin contracts. It includes the `ERC721Enumerable` extension.
    *   Minting of Pokemon cards with unique attributes (Pokemon ID, Rarity).
    *   Ownership tracking and transfer capabilities.
    *   Metadata storage for Pokemon ID and rarity.
2. **PokemonCardTrading.sol**: Manages the marketplace logic. It inherits `Ownable`, `ReentrancyGuard`, and `Pausable` from OpenZeppelin.
    *   Fixed-price listings.
    *   Time-limited auctions.
    *   Secure escrow for listed cards via contract ownership during listing.
    *   Withdrawal system for sellers using the pull-payment pattern.
    *   Emergency stop functionality.

Both contracts use OpenZeppelin libraries for security and standard compliance.

### Frontend Architecture

The frontend is built with a component-based architecture centered around React:

#### State Management

- **Context API (`AppContext.jsx`)**: Global state management for wallet connection, contract instances, and shared functions.
- **Component-Level State (`useState`)**: Used for local UI state within components.
- **Custom Hooks (`useApp`)**: Provides easy access to the global context.

## Project Structure

```
DeFiPokemonCardTrading/
├── contracts/                  # Solidity smart contracts
│   ├── PokemonCardToken.sol    # ERC-721 NFT contract
│   └── PokemonCardTrading.sol  # Marketplace contract
├── frontend/                   # React frontend application
│   ├── public/                 # Static assets
│   ├── src/                    # Frontend source code
│   │   ├── components/         # React components
│   │   ├── contexts/           # AppContext provider
│   │   ├── contracts/          # Contract ABIs
│   │   ├── pages/              # Page-level components
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Main application component
│   │   └── main.jsx            # Application entry point
│   ├── .env.example            # Example environment variables template
│   ├── deploy-frontend.sh      # Frontend deployment script
│   ├── index.html              # Vite entry HTML
│   ├── package.json            # Frontend dependencies and scripts
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.js          # Vite configuration
├── scripts/                    # Deployment and helper scripts (e.g., deploy.js)
├── test/                       # Contract test scripts
├── .env.example                # Example project-level environment variables
├── .gitignore                  # Git ignore file
├── hardhat.config.js           # Hardhat configuration
├── package.json                # Project dependencies and scripts (Hardhat, etc.)
├── README.md                   # This document
├── deploy-local.sh             # Local deployment script
└── deploy-sepolia.sh           # Sepolia deployment script
```

## Smart Contract Features

### PokemonCardToken

- **ERC-721 Standard**: Fully compliant with ERC-721 NFT standard.
- **ERC-721Enumerable**: Supports enumeration of tokens owned by an address.
- **Card Attributes**: Each card has a Pokemon ID (1-151) and rarity level (Common, Rare, Epic).
- **Access Control**: Only the contract owner can mint new cards (`Ownable`).
- **Events**: Comprehensive event emission for minting and transfers.

### PokemonCardTrading

- **Marketplace Features**: Fixed-price listings and auctions.
- **Security**: Reentrancy protection, secure escrow pattern for listed NFTs.
- **Emergency Stop**: Pausable functionality allowing the owner to halt trading.
- **Withdrawal System**: Secure fund withdrawal for sellers (`withdraw` function using pull-payment).
- **Auction Mechanics**: Bidding, time-based ending, and finalization.
- **Listing Management**: Create, cancel, and fulfill listings.
- **Access Control**: Contract ownership (`Ownable`) for pausing/unpausing.

## Frontend Features

- **Wallet Connection**: Easy connection to MetaMask via ethers.js.
- **Card Display**: Visual representation of Pokemon cards with type information fetched from PokeAPI.
- **Collection View**: Personal collection management.
- **Marketplace**: Browse, buy, and bid on listed cards.
- **Selling Interface**: List cards for fixed price or auction.
- **Card Filtering**: Filter cards by Pokemon type, rarity, price, and listing type.
- **Responsive Design**: Works well on all device sizes

## Testing Features

### Contract Test Scripts

After deploying the contracts locally, you can execute test scripts that will check all the functionalities of the contracts. (If the frontend is running, you can directly view the cards and listings that are created by them)

```bash
npx hardhat run test/mint-test.js --network localhost
npx hardhat run test/fixed-price-test.js --network localhost
npx hardhat run test/auction-test.js --network localhost
npx hardhat run test/listing-test.js --network localhost
npx hardhat run test/comprehensive-test.js --network localhost
```

### Explicit Testing

For more granular testing, connect your wallet to the frontend after deploying locally. Make sure to switch your wallet to the correct local network and use either the private key provided by the deploy-local script or one from the generated hardhat_node.log file to interact with the contracts directly.

### Frontend Dev Mode

The application includes development features to help test and debug:

- **Mock Data**: Provides fallback data when contract calls fail.
- **Contract Status Indicator**: Displays connection status on the HomePage.
- **Diagnostic Tools**: Built-in troubleshooting tools accessible from the HomePage.

To use development mode:

1.  Start the frontend with `npm run dev`.
2.  Use diagnostic tools for contract connectivity issues.
3.  Check functionality with mock data.

## Security Considerations

The contracts implement several best practices:

- **Reentrancy Protection**: Using OpenZeppelin's `ReentrancyGuard` on relevant functions.
- **Access Control**: Using OpenZeppelin's `Ownable` for administrative functions (minting, pausing). Correct checks for `msg.sender` in user actions (listing, bidding, canceling).
- **Emergency Stop**: Implemented via OpenZeppelin's `Pausable` contract.
- **Integer Overflow/Underflow**: Mitigated by using Solidity version `^0.8.0`.
- **Escrow Pattern**: Listed NFTs are transferred to the trading contract, preventing the seller from transferring them elsewhere while listed.
- **Withdrawal Pattern**: Uses the pull-payment pattern (`withdraw` function) to mitigate reentrancy risks associated with direct transfers.
- **Event Emissions**: Comprehensive event logs for significant actions.

## Common Issues

- **MetaMask not detecting**: Ensure the browser extension is installed, enabled, and unlocked.
- **Wrong network**: Switch to the correct network (Localhost, Sepolia) in MetaMask. Check the Chain ID.
- **Invalid contract addresses**: Double-check the `VITE_TOKEN_CONTRACT_ADDRESS` and `VITE_TRADING_CONTRACT_ADDRESS` in your `frontend/.env` file match the deployed addresses. Ensure the frontend app was restarted after changing `.env`.
- **Transaction Errors**: Check the browser console and MetaMask activity for detailed error messages. Ensure sufficient funds for gas fees.

## Etherscan Verification

Contract verification on Etherscan is automatic if the `ETHERSCAN_API_KEY` is correctly set in the project's root `.env` file during deployment via Hardhat. If manual verification is needed:

```bash
# Ensure hardhat-etherscan plugin is installed: npm install --save-dev @nomicfoundation/hardhat-verify

# Verify token contract (replace YOUR_TOKEN_ADDRESS)
npx hardhat verify --network sepolia YOUR_TOKEN_ADDRESS

# Verify trading contract (replace addresses)
# Constructor argument (_pokemonCardContract) needs to be provided
npx hardhat verify --network sepolia YOUR_TRADING_ADDRESS YOUR_TOKEN_ADDRESS
```

## Technologies Used

- **Blockchain**: Ethereum (Sepolia Testnet), Hardhat (Development Environment)
- **Smart Contracts**: Solidity `^0.8.20`, OpenZeppelin Contracts
- **Frontend**: React 18, Vite, Tailwind CSS
- **Blockchain Interaction**: ethers.js v6
- **External Data**: PokeAPI

## Acknowledgements

As encouraged by the coursework, GenAI tools were utilized in the development of this project. Specifically, Google's Gemini 2.5 and Anthropic's Claude 3.7 provided valuable assistance. Special thanks for their help with coding the deployment scripts, their assistance in building and designing the frontend, and their input on documentation and adherence to Solidity style guides.

