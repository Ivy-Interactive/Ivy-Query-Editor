#!/bin/bash

PRD_PATH=$1

if [ -z "$PRD_PATH" ]; then
    echo "Usage: ./validate-prd.sh <path-to-prd>"
    exit 1
fi

if [ ! -f "$PRD_PATH" ]; then
    echo "Error: PRD file not found at $PRD_PATH"
    exit 1
fi

echo "Validating PRD: $PRD_PATH"
echo "========================================"
echo ""

# Check required sections
required_sections=(
    "## Overview"
    "## Goals"
    "## User Stories"
    "## Functional Requirements"
    "## Technical Requirements"
)

all_found=true

for section in "${required_sections[@]}"; do
    if grep -q "$section" "$PRD_PATH"; then
        echo "✓ $section found"
    else
        echo "✗ $section MISSING"
        all_found=false
    fi
done

echo ""
if [ "$all_found" = true ]; then
    echo "✅ PRD validation passed!"
    exit 0
else
    echo "❌ PRD validation failed - missing required sections"
    exit 1
fi
