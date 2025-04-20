#!/bin/bash

# Set the version you want
KEYCLOAK_VERSION=24.0.1

# Download URL
KEYCLOAK_URL="https://github.com/keycloak/keycloak/releases/download/${KEYCLOAK_VERSION}/keycloak-${KEYCLOAK_VERSION}.zip"

# Download and extract
echo "Downloading Keycloak ${KEYCLOAK_VERSION}..."
curl -L -o keycloak.zip "$KEYCLOAK_URL"

echo "Unzipping..."
unzip keycloak.zip

# Clean up
rm keycloak.zip

# Done
cd keycloak-${KEYCLOAK_VERSION}
echo "Keycloak ready in $(pwd)"