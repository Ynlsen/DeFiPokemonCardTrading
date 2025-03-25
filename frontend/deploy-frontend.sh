#!/bin/bash

# Pokemon Card Trading dApp - Frontend Deployment Script
# This script deploys the frontend with proper contract configurations

# Text formatting
BOLD="\e[1m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
RED="\e[31m"
ENDCOLOR="\e[0m"

# Default RPC URLs
DEFAULT_SEPOLIA_RPC="https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
DEFAULT_LOCAL_RPC="http://localhost:8545"

echo -e "${BOLD}${GREEN}Pokemon Card Trading dApp - Frontend Deployment${ENDCOLOR}"
echo -e "${YELLOW}This script will deploy the frontend with proper contract configurations${ENDCOLOR}"
echo ""

# Function to handle errors
handle_error() {
  echo -e "${RED}Error: $1${ENDCOLOR}"
  exit 1
}

# Check for .env file
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}No environment configuration found. Please run one of the deployment scripts first:${ENDCOLOR}"
  echo -e "${BLUE}1. ../deploy-sepolia.sh - for Sepolia testnet${ENDCOLOR}"
  echo -e "${BLUE}2. ../deploy-local.sh - for local development${ENDCOLOR}"
  echo ""
  echo -e "${YELLOW}Or provide the contract addresses manually:${ENDCOLOR}"
  read -p "Token contract address: " TOKEN_ADDRESS
  read -p "Trading contract address: " TRADING_ADDRESS
  
  if [ -z "$TOKEN_ADDRESS" ] || [ -z "$TRADING_ADDRESS" ]; then
    handle_error "Contract addresses are required"
  fi
  
  echo -e "${YELLOW}Which network are you connecting to?${ENDCOLOR}"
  echo -e "1) Sepolia testnet"
  echo -e "2) Local hardhat node"
  echo -e "3) Other (custom)"
  read -p "> " NETWORK_CHOICE
  
  case $NETWORK_CHOICE in
    1)
      NETWORK_ID=11155111
      NETWORK_NAME="Sepolia"
      RPC_URL="https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
      ;;
    2)
      NETWORK_ID=31337
      NETWORK_NAME="Local"
      RPC_URL="http://localhost:8545"
      ;;
    3)
      read -p "Network ID: " NETWORK_ID
      read -p "Network Name: " NETWORK_NAME
      read -p "RPC URL: " RPC_URL
      ;;
    *)
      NETWORK_ID=11155111
      NETWORK_NAME="Sepolia"
      RPC_URL="https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
      ;;
  esac
  
  # Create .env file with provided information
  echo -e "${BLUE}Creating environment configuration...${ENDCOLOR}"
  cat > .env << EOL
VITE_TOKEN_CONTRACT_ADDRESS=$TOKEN_ADDRESS
VITE_TRADING_CONTRACT_ADDRESS=$TRADING_ADDRESS
VITE_NETWORK_ID=$NETWORK_ID
VITE_RPC_URL=$RPC_URL
EOL
else
  # Load existing configuration
  echo -e "${BLUE}Using existing environment configuration...${ENDCOLOR}"
  TOKEN_ADDRESS=$(grep VITE_TOKEN_CONTRACT_ADDRESS .env | cut -d '=' -f2)
  TRADING_ADDRESS=$(grep VITE_TRADING_CONTRACT_ADDRESS .env | cut -d '=' -f2)
  NETWORK_ID=$(grep VITE_NETWORK_ID .env | cut -d '=' -f2)
  RPC_URL=$(grep VITE_RPC_URL .env | cut -d '=' -f2)
  
  if [ "$NETWORK_ID" = "11155111" ]; then
    NETWORK_NAME="Sepolia"
  elif [ "$NETWORK_ID" = "31337" ]; then
    NETWORK_NAME="Local"
  else
    NETWORK_NAME="Custom"
  fi
fi

echo -e "${GREEN}Frontend configuration:${ENDCOLOR}"
echo -e "Token contract: ${BLUE}$TOKEN_ADDRESS${ENDCOLOR}"
echo -e "Trading contract: ${BLUE}$TRADING_ADDRESS${ENDCOLOR}"
echo -e "Network: ${BLUE}${NETWORK_NAME} (ID: $NETWORK_ID)${ENDCOLOR}"

# Check for and install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}Installing frontend dependencies...${ENDCOLOR}"
  npm install || handle_error "Failed to install frontend dependencies"
else
  echo -e "${GREEN}Frontend dependencies already installed${ENDCOLOR}"
fi

# Build frontend
echo -e "${BLUE}Building frontend...${ENDCOLOR}"
npm run build || handle_error "Failed to build frontend"

# Deployment complete
echo -e "${BOLD}${GREEN}Frontend Deployment Complete!${ENDCOLOR}"
echo -e "${YELLOW}Your app will be available at http://localhost:8080${ENDCOLOR}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${ENDCOLOR}"
echo -e "${BOLD}${YELLOW}Make sure your wallet is connected to the ${NETWORK_NAME} network!${ENDCOLOR}"
echo -e "${BOLD}${YELLOW}Make sure your wallet is connected to the ${NETWORK_NAME} network!${ENDCOLOR}"

npm run serve