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

# Default Sepolia RPC URL - public Infura endpoint
DEFAULT_RPC_URL="https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"

echo -e "${BOLD}${GREEN}Pokemon Card Trading dApp - Sepolia Testnet Deployment${ENDCOLOR}"
echo -e "${YELLOW}This script will deploy contracts to Sepolia testnet${ENDCOLOR}"
echo ""

# Function to handle errors
handle_error() {
  echo -e "${RED}Error: $1${ENDCOLOR}"
  exit 1
}

# Check for private key and RPC URL
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}Environment file not found. Setting up deployment configuration...${ENDCOLOR}"
  
  # Ask for private key directly
  echo -e "${YELLOW}Please enter your Ethereum private key for deployment to Sepolia:${ENDCOLOR}"
  read -p "> " PRIVATE_KEY
  
  if [ -z "$PRIVATE_KEY" ]; then
    handle_error "Private key is required for deployment"
  fi
  
  # Ask if they want to use default RPC or provide their own
  echo -e "${YELLOW}Use default Sepolia RPC URL (public Infura endpoint)? (y/n)${ENDCOLOR}"
  read -p "> " USE_DEFAULT_RPC
  
  if [[ $USE_DEFAULT_RPC =~ ^[Yy]$ ]] || [ -z "$USE_DEFAULT_RPC" ]; then
    SEPOLIA_RPC_URL=$DEFAULT_RPC_URL
    echo -e "${GREEN}Using default Sepolia RPC URL${ENDCOLOR}"
  else
    echo -e "${YELLOW}Please enter your Sepolia RPC URL:${ENDCOLOR}"
    read -p "> " SEPOLIA_RPC_URL
    
    if [ -z "$SEPOLIA_RPC_URL" ]; then
      echo -e "${YELLOW}No RPC URL provided, using default${ENDCOLOR}"
      SEPOLIA_RPC_URL=$DEFAULT_RPC_URL
    fi
  fi
  
  # Create new .env file
  cat > .env << EOL
SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL
PRIVATE_KEY=$PRIVATE_KEY
EOL
  echo -e "${GREEN}Created .env file with deployment configuration${ENDCOLOR}"
else
  # .env exists, check for required values
  SEPOLIA_RPC_URL=$(grep SEPOLIA_RPC_URL .env | cut -d '=' -f2)
  PRIVATE_KEY=$(grep PRIVATE_KEY .env | cut -d '=' -f2)
  
  # Check private key
  if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" = "your-private-key" ]; then
    echo -e "${YELLOW}Private key not found in .env file${ENDCOLOR}"
    echo -e "${YELLOW}Please enter your Ethereum private key for deployment to Sepolia:${ENDCOLOR}"
    read -p "> " PRIVATE_KEY
    
    if [ -z "$PRIVATE_KEY" ]; then
      handle_error "Private key is required for deployment"
    fi
    
    # Update private key in .env
    if grep -q "PRIVATE_KEY=" .env; then
      sed -i "s/PRIVATE_KEY=.*/PRIVATE_KEY=$PRIVATE_KEY/" .env
    else
      echo "PRIVATE_KEY=$PRIVATE_KEY" >> .env
    fi
  fi
  
  # Check RPC URL
  if [ -z "$SEPOLIA_RPC_URL" ] || [ "$SEPOLIA_RPC_URL" = "your-sepolia-rpc-url" ]; then
    echo -e "${YELLOW}Sepolia RPC URL not found in .env file${ENDCOLOR}"
    echo -e "${YELLOW}Use default Sepolia RPC URL (public Infura endpoint)? (y/n)${ENDCOLOR}"
    read -p "> " USE_DEFAULT_RPC
    
    if [[ $USE_DEFAULT_RPC =~ ^[Yy]$ ]] || [ -z "$USE_DEFAULT_RPC" ]; then
      SEPOLIA_RPC_URL=$DEFAULT_RPC_URL
      echo -e "${GREEN}Using default Sepolia RPC URL${ENDCOLOR}"
    else
      echo -e "${YELLOW}Please enter your Sepolia RPC URL:${ENDCOLOR}"
      read -p "> " SEPOLIA_RPC_URL
      
      if [ -z "$SEPOLIA_RPC_URL" ]; then
        echo -e "${YELLOW}No RPC URL provided, using default${ENDCOLOR}"
        SEPOLIA_RPC_URL=$DEFAULT_RPC_URL
      fi
    fi
    
    # Update RPC URL in .env
    if grep -q "SEPOLIA_RPC_URL=" .env; then
      sed -i "s/SEPOLIA_RPC_URL=.*/SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL/" .env
    else
      echo "SEPOLIA_RPC_URL=$SEPOLIA_RPC_URL" >> .env
    fi
  fi
fi

echo -e "${GREEN}Using Sepolia RPC URL: ${SEPOLIA_RPC_URL}${ENDCOLOR}"

# Check for Etherscan API key - ask user if it's not present or is the default
ETHERSCAN_API_KEY=$(grep ETHERSCAN_API_KEY .env | cut -d '=' -f2)
if [ -z "$ETHERSCAN_API_KEY" ] || [ "$ETHERSCAN_API_KEY" = "your-etherscan-api-key" ]; then
  echo -e "${YELLOW}Would you like to verify your contracts on Etherscan? (y/n)${ENDCOLOR}"
  read -p "> " VERIFY_CHOICE
  
  if [[ $VERIFY_CHOICE =~ ^[Yy]$ ]]; then
    read -p "Enter your Etherscan API key: " ETHERSCAN_API_KEY
    
    # Update the .env file with the new API key
    if grep -q "ETHERSCAN_API_KEY" .env; then
      sed -i "s/ETHERSCAN_API_KEY=.*/ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY/" .env
    else
      echo "ETHERSCAN_API_KEY=$ETHERSCAN_API_KEY" >> .env
    fi
    
    echo -e "${GREEN}Etherscan API key saved to .env${ENDCOLOR}"
  else
    echo -e "${YELLOW}Skipping contract verification${ENDCOLOR}"
    ETHERSCAN_API_KEY=""
  fi
fi

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