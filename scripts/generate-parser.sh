#!/bin/bash

# Generate parser and lexer from ANTLR4 grammar
# This script uses the antlr4 JAR to generate JavaScript parser files

set -e

echo "Generating parser from docs/grammar/Filters.g4..."

# Ensure ANTLR is installed
if [ ! -f "tools/antlr4" ]; then
    echo "Installing ANTLR4..."
    ./scripts/install-antlr.sh
fi

# Create output directory if it doesn't exist
mkdir -p src/generated

# Generate parser with visitor pattern
./tools/antlr4 -Dlanguage=JavaScript -visitor -o src/generated docs/grammar/Filters.g4

# Check if generation was successful
if [ $? -eq 0 ]; then
    echo "✅ Parser generated successfully in src/generated/"
    echo "Generated files:"
    ls -la src/generated/
else
    echo "❌ Failed to generate parser"
    exit 1
fi