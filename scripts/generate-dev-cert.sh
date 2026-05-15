#!/usr/bin/env bash
set -euo pipefail

CERT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/certs"
DOMAIN="10.101.0.21.nip.io"
KEY_FILE="$CERT_DIR/$DOMAIN.key"
CRT_FILE="$CERT_DIR/$DOMAIN.crt"

mkdir -p "$CERT_DIR"

env -u LD_LIBRARY_PATH openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout "$KEY_FILE" \
  -out "$CRT_FILE" \
  -days 825 \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN,DNS:localhost,IP:10.101.0.21,IP:127.0.0.1"

echo "Created: $KEY_FILE"
echo "Created: $CRT_FILE"
echo "Open https://$DOMAIN:5173 and accept the browser warning once."
