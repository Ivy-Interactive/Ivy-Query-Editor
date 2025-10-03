#!/bin/bash

# Install ANTLR4 tool for generating parsers
# This script downloads the ANTLR JAR file needed for parser generation

set -e

ANTLR_VERSION="4.13.1"
ANTLR_JAR="antlr-${ANTLR_VERSION}-complete.jar"
ANTLR_URL="https://www.antlr.org/download/${ANTLR_JAR}"

echo "Setting up ANTLR4 ${ANTLR_VERSION}..."

# Create tools directory
mkdir -p tools

# Download ANTLR JAR if not present
if [ ! -f "tools/${ANTLR_JAR}" ]; then
    echo "Downloading ANTLR4 JAR..."
    curl -o "tools/${ANTLR_JAR}" "${ANTLR_URL}"
    echo "✅ ANTLR4 downloaded to tools/${ANTLR_JAR}"
else
    echo "✅ ANTLR4 JAR already present"
fi

# Create convenience script for running ANTLR
cat > tools/antlr4 << 'EOF'
#!/bin/bash
java -jar "$(dirname "$0")/antlr-4.13.1-complete.jar" "$@"
EOF

chmod +x tools/antlr4

echo "✅ ANTLR4 setup complete"
echo "You can now generate parsers using: ./tools/antlr4 [options] grammar.g4"