#!/bin/bash

# Pokemon Card Trading dApp - Sepolia Testnet Deployment Script
# This script deploys contracts to Sepolia testnet

# Text formatting
BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RED="\e[31m"
ENDCOLOR="\e[0m"


echo -e "${BOLD}${GREEN}Pokemon Card Trading dApp - Sepolia Testnet Deployment${ENDCOLOR}"
echo -e "${YELLOW}This script will deploy contracts to Sepolia testnet${ENDCOLOR}"
echo ""

# Function to handle errors
handle_error() {
  echo -e "${RED}Error: $1${ENDCOLOR}"
  exit 1
}

# --- Environment Setup --- 
PRIVATE_KEY=""
SEPOLIA_RPC_URL=""
ETHERSCAN_API_KEY=""

# Check if .env exists and load variables
if [ -f ".env" ]; then
  echo -e "${BLUE}Loading configuration from .env file...${ENDCOLOR}"
  # Use grep and cut safely, handling cases where variable might not exist
  PRIVATE_KEY=$(grep '^PRIVATE_KEY=' .env | cut -d '=' -f2)
  SEPOLIA_RPC_URL=$(grep '^SEPOLIA_RPC_URL=' .env | cut -d '=' -f2)
  ETHERSCAN_API_KEY=$(grep '^ETHERSCAN_API_KEY=' .env | cut -d '=' -f2)
fi

# --- Validate/Prompt for Private Key --- 
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your-private-key" ]; then
  echo -e "${YELLOW}Ethereum Private Key for deployment not found or is default.${ENDCOLOR}"
  echo -e "${YELLOW}Please enter the private key of the account you want to deploy from:${ENDCOLOR}"
  read -sp "> " PRIVATE_KEY # Use -s for secure input
  echo # Add a newline after secure input
  if [ -z "$PRIVATE_KEY" ]; then
    handle_error "Private key is required for deployment."
  fi
  # Update .env or create if needed
  if grep -q "^PRIVATE_KEY=" .env 2>/dev/null; then
    sed -i "s|^PRIVATE_KEY=.*|PRIVATE_KEY=$PRIVATE_KEY|" .env
  else
    echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env
  fi
  echo -e "${GREEN}Private Key saved/updated in .env${ENDCOLOR}"
fi

# --- Validate/Prompt for Sepolia RPC URL --- 
if [ -z "$SEPOLIA_RPC_URL" ] || [[ "$SEPOLIA_RPC_URL" == *"your-sepolia-rpc-url"* ]]; then # Check for placeholder too
  echo -e "${YELLOW}Sepolia RPC URL not found or is default.${ENDCOLOR}"
  echo -e "${YELLOW}An RPC URL is required to connect to the Sepolia network for deployment."
  echo -e "${YELLOW}You can get one for free from services like Infura (infura.io) or Alchemy (alchemy.com)."
  echo -e "${YELLOW}Please enter your full Sepolia RPC URL (e.g., https://sepolia.infura.io/v3/YOUR_API_KEY):${ENDCOLOR}"
  read -p "> " SEPOLIA_RPC_URL
  if [ -z "$SEPOLIA_RPC_URL" ]; then
    handle_error "Sepolia RPC URL is required for deployment."
  fi
  # Update .env or create if needed
  if grep -q "^SEPOLIA_RPC_URL=" .env 2>/dev/null; then
    sed -i "s|^SEPOLIA_RPC_URL=.*|SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL|" .env
  else
    echo "SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL" >> .env
  fi
  echo -e "${GREEN}Sepolia RPC URL saved/updated in .env${ENDCOLOR}"
fi

echo -e "${BLUE}Using Sepolia RPC URL: ${SEPOLIA_RPC_URL}${ENDCOLOR}"

# --- Validate/Prompt for Etherscan API Key (Optional Verification) --- 
if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your-etherscan-api-key" ]; then
  echo -e "${YELLOW}Etherscan API Key not found or is default.${ENDCOLOR}"
  echo -e "${YELLOW}Do you want to attempt contract verification on Sepolia Etherscan? (Requires an API Key) (y/n)${ENDCOLOR}"
  read -p "> " VERIFY_CHOICE
  if [[ $VERIFY_CHOICE =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please enter your Etherscan API Key:${ENDCOLOR}"
    read -p "> " ETHERSCAN_API_KEY
    if [ -z "$ETHERSCAN_API_KEY" ]; then
       echo -e "${YELLOW}No Etherscan API Key provided. Skipping verification.${ENDCOLOR}"
       ETHERSCAN_API_KEY="" # Ensure it's empty if user provided nothing
    else
        # Update .env or create if needed
        if grep -q "^ETHERSCAN_API_KEY=" .env 2>/dev/null; then
            sed -i "s|^ETHERSCAN_API_KEY=.*|ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY|" .env
        else
            echo "ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY" >> .env
        fi
        echo -e "${GREEN}Etherscan API Key saved/updated in .env${ENDCOLOR}"
    fi
  else
    echo -e "${YELLOW}Skipping Etherscan verification setup.${ENDCOLOR}"
    ETHERSCAN_API_KEY="" # Ensure it's empty if skipping
  fi
fi

# --- Deployment Steps --- 

# Check dependencies
echo -e "${BLUE}Checking project dependencies...${ENDCOLOR}"
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing root project dependencies...${ENDCOLOR}"
  npm install || handle_error "Failed to install root dependencies"
else
  echo -e "${GREEN}Root dependencies already installed${ENDCOLOR}"
fi

# Compile contracts
echo -e "${BLUE}Compiling smart contracts...${ENDCOLOR}"
npx hardhat compile || handle_error "Failed to compile contracts"

# Deploy contracts to Sepolia
echo -e "${BLUE}Deploying contracts to Sepolia testnet...${ENDCOLOR}"
echo -e "${YELLOW}This may take a few minutes. Please be patient.${ENDCOLOR}"
DEPLOYMENT_OUTPUT=$(npx hardhat run scripts/deploy.js --network sepolia)

# Check deployment success
if [ $? -ne 0 ]; then
  handle_error "Failed to deploy contracts to Sepolia"
fi

echo -e "${GREEN}Contracts deployed successfully to Sepolia!${ENDCOLOR}"

# Extract contract addresses
TOKEN_ADDRESS=$(echo "$DEPLOYMENT_OUTPUT" | grep "PokemonCardToken deployed to:" | awk '{print $NF}')
TRADING_ADDRESS=$(echo "$DEPLOYMENT_OUTPUT" | grep "PokemonCardTrading deployed to:" | awk '{print $NF}')

if [ -z "$TOKEN_ADDRESS" ] || [ -z "$TRADING_ADDRESS" ]; then
  handle_error "Failed to extract contract addresses"
fi

echo -e "${GREEN}Contract addresses extracted:${ENDCOLOR}"
echo -e "Token Contract: ${BLUE}$TOKEN_ADDRESS${ENDCOLOR}"
echo -e "Trading Contract: ${BLUE}$TRADING_ADDRESS${ENDCOLOR}"

# Create frontend .env file with contract addresses
echo -e "${BLUE}Creating frontend environment configuration...${ENDCOLOR}"
cat > frontend/.env << EOL
VITE_TOKEN_CONTRACT_ADDRESS=$TOKEN_ADDRESS
VITE_TRADING_CONTRACT_ADDRESS=$TRADING_ADDRESS
VITE_NETWORK_ID=11155111
VITE_RPC_URL=$SEPOLIA_RPC_URL
EOL

# Verify contracts on Etherscan if API key is available
if [ -n "$ETHERSCAN_API_KEY" ] && [ "$ETHERSCAN_API_KEY" != "your-etherscan-api-key" ]; then
  echo -e "${BLUE}Verifying PokemonCardToken contract on Etherscan...${ENDCOLOR}"
  npx hardhat verify --network sepolia $TOKEN_ADDRESS || echo -e "${YELLOW}Token verification failed, but continuing deployment...${ENDCOLOR}"
  
  echo -e "${BLUE}Verifying PokemonCardTrading contract on Etherscan...${ENDCOLOR}"
  npx hardhat verify --network sepolia $TRADING_ADDRESS $TOKEN_ADDRESS || echo -e "${YELLOW}Trading verification failed, but continuing deployment...${ENDCOLOR}"
else
  echo -e "${YELLOW}Skipping contract verification as no valid Etherscan API key was provided.${ENDCOLOR}"
  echo -e "${YELLOW}To verify contracts later, run:${ENDCOLOR}"
  echo -e "${BLUE}npx hardhat verify --network sepolia $TOKEN_ADDRESS${ENDCOLOR}"
  echo -e "${BLUE}npx hardhat verify --network sepolia $TRADING_ADDRESS $TOKEN_ADDRESS${ENDCOLOR}"
fi

# Deployment complete
echo -e "${BOLD}${GREEN}Deployment Complete!${ENDCOLOR}"
echo -e "${BOLD}${YELLOW}Next Steps:${ENDCOLOR}"
echo -e "${YELLOW}1. To deploy the frontend, run:${ENDCOLOR}"
echo -e "${BLUE}   cd frontend && ./deploy-frontend.sh${ENDCOLOR}"
echo -e "${YELLOW}2. Frontend environment is configured in frontend/.env${ENDCOLOR}"
echo ""
echo -e "${GREEN}Sepolia contract deployment successful!${ENDCOLOR}" 