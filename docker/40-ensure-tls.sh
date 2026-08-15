#!/bin/sh
# Generate a self-signed cert if none is mounted (TDK can replace with a CA cert).
set -e
CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"
if [ -f "$CERT_DIR/tls.crt" ] && [ -f "$CERT_DIR/tls.key" ]; then
  exit 0
fi
if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl missing; cannot create TLS certs" >&2
  exit 1
fi
CN="${TLS_CN:-ussjc-scps01.invcorp.invensense.com}"
openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
  -keyout "$CERT_DIR/tls.key" \
  -out "$CERT_DIR/tls.crt" \
  -subj "/CN=${CN}" \
  -addext "subjectAltName=DNS:${CN},DNS:localhost,IP:10.0.65.19,IP:127.0.0.1"
chmod 600 "$CERT_DIR/tls.key"
echo "Created self-signed TLS cert for ${CN}"
