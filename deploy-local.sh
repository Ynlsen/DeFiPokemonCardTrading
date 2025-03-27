#!/bin/bash

# Pokemon Card Trading dApp - Local Deployment Script
# This script deploys contracts locally using Hardhat node

# Text formatting
BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RED="\e[31m"
ENDCOLOR="\e[0m"

echo -e "${BOLD}${GREEN}Pokemon Card Trading dApp - Local Deployment${ENDCOLOR}"
echo -e "${YELLOW}This script will deploy contracts locally using Hardhat node${ENDCOLOR}"
echo ""

# Function to handle errors
handle_error() {
  echo -e "${RED}Error: $1${ENDCOLOR}"
  kill $NODE_PID 2>/dev/null
  exit 1
}

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

# Start Hardhat node in background
echo -e "${BLUE}Starting Hardhat node...${ENDCOLOR}"
npx hardhat node > hardhat_node.log 2>&1 &
NODE_PID=$!

# Check if the node started successfully
sleep 3
if ! ps -p $NODE_PID > /dev/null; then
  echo -e "${YELLOW}Node failed to start, attempting to free port 8545...${ENDCOLOR}"
  npx kill-port 8545 || true
  echo -e "${BLUE}Starting Hardhat node again...${ENDCOLOR}"
  npx hardhat node > hardhat_node.log 2>&1 &
  NODE_PID=$!
  sleep 3
  if ! ps -p $NODE_PID > /dev/null; then
    handle_error "Failed to start Hardhat node"
  fi
fi

echo -e "${GREEN}Hardhat node started successfully${ENDCOLOR}"

# Wait for node to be fully initialized
echo -e "${YELLOW}Waiting for Hardhat node to initialize...${ENDCOLOR}"
sleep 3

# Deploy contracts
echo -e "${BLUE}Deploying contracts to local network...${ENDCOLOR}"
DEPLOYMENT_OUTPUT=$(npx hardhat run scripts/deploy.js --network localhost)

# Check deployment success
if [ $? -ne 0 ]; then
  handle_error "Failed to deploy contracts"
fi

echo -e "${GREEN}Contracts deployed successfully!${ENDCOLOR}"

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
VITE_NETWORK_ID=31337
VITE_RPC_URL=http://localhost:8545
EOL

# Also create/update main .env file with contract addresses for test scripts
echo -e "${BLUE}Updating main .env file for test scripts...${ENDCOLOR}"
if [ -f ".env" ]; then
  # If .env exists, update/add the contract addresses
  if grep -q "TOKEN_ADDRESS=" .env; then
    sed -i "s/TOKEN_ADDRESS=.*/TOKEN_ADDRESS=$TOKEN_ADDRESS/" .env
  else
    echo "TOKEN_ADDRESS=$TOKEN_ADDRESS" >> .env
  fi
  
  if grep -q "TRADING_ADDRESS=" .env; then
    sed -i "s/TRADING_ADDRESS=.*/TRADING_ADDRESS=$TRADING_ADDRESS/" .env
  else
    echo "TRADING_ADDRESS=$TRADING_ADDRESS" >> .env
  fi
else
  # Create new .env file with contract addresses
  cat > .env << EOL
TOKEN_ADDRESS=$TOKEN_ADDRESS
TRADING_ADDRESS=$TRADING_ADDRESS
EOL
fi

# Set up trap to handle Ctrl+C and clean up the node
trap 'echo -e "${BLUE}Stopping Hardhat node...${ENDCOLOR}"; kill $NODE_PID 2>/dev/null; exit 0' SIGINT

# Deployment complete - show next steps and test info
echo -e "${BOLD}${GREEN}Local Deployment Complete!${ENDCOLOR}"
echo -e "${BOLD}${YELLOW}Next Steps:${ENDCOLOR}"
echo -e "${YELLOW}1. To deploy the frontend, run:${ENDCOLOR}"
echo -e "${BLUE}   cd frontend && ./deploy-frontend.sh${ENDCOLOR}"
echo -e "${YELLOW}2. The Hardhat node is running in the background (Ctrl+C to stop)${ENDCOLOR}"
echo -e "${YELLOW}3. Frontend environment is configured in frontend/.env${ENDCOLOR}"
echo ""
echo -e "${BOLD}${YELLOW}Testing your dApp:${ENDCOLOR}"
echo -e "${YELLOW}Run test scripts to interact with contracts:${ENDCOLOR}"
echo -e "${BLUE}   npx hardhat run test/mint-test.js --network localhost${ENDCOLOR}"
echo -e "${BLUE}   npx hardhat run test/fixed-price-test.js --network localhost${ENDCOLOR}"
echo -e "${BLUE}   npx hardhat run test/auction-test.js --network localhost${ENDCOLOR}"
echo -e "${BLUE}   npx hardhat run test/comprehensive-test.js --network localhost${ENDCOLOR}"

echo -e "${YELLOW}Or import one of the test accounts into your wallet (very useful for testing the frontend) using:${ENDCOLOR}"
echo -e "${BLUE}   Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80${ENDCOLOR}"
echo -e "${YELLOW}More accounts and general logs can be found in hardhat_node.log${ENDCOLOR}"
echo ""
echo -e "${GREEN}Local contract deployment successful!${ENDCOLOR}"

# Wait for Ctrl+C to stop the Hardhat node
echo -e "${YELLOW}Hardhat node is running... (Press Ctrl+C to stop)${ENDCOLOR}"
wait $NODE_PID 