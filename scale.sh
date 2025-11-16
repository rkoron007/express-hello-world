#!/bin/bash

# Exit on any error
set -e

# Debug: Print what we're seeing
echo "DEBUG: TARGET_SERVICE_ID = $TARGET_SERVICE_ID"
echo "DEBUG: RENDER_API_KEY exists = $([ -n "$RENDER_API_KEY" ] && echo 'yes' || echo 'no')"

# Check required variables
if [ -z "$RENDER_API_KEY" ] || [ -z "$TARGET_SERVICE_ID" ]; then
  echo "Error: RENDER_API_KEY and TARGET_SERVICE_ID must be set"
  exit 1
fi

# Get the desired instance count from the first argument
INSTANCE_COUNT=$1

if [ -z "$INSTANCE_COUNT" ]; then
  echo "Error: Instance count not provided"
  echo "Usage: $0 <instance_count>"
  exit 1
fi

# Call the Render API to scale the service
echo "Scaling service $TARGET_SERVICE_ID to $INSTANCE_COUNT instances..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://api.render.com/v1/services/$TARGET_SERVICE_ID/scale" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"numInstances\": $INSTANCE_COUNT}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 202 ]; then
  echo "Successfully scaled to $INSTANCE_COUNT instances"
  exit 0
else
  echo "Error: Failed to scale service (HTTP $HTTP_CODE)"
  echo "$BODY"
  exit 1
fi