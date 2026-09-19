#!/bin/bash
# Puts the DEV tier back to a clean baseline for e2e/auth-security.e2e.mjs:
# no MFA on any user, "require MFA" off, no SSO config, and no leftover SSO
# test user. Reads the dev DB credentials from TMS-Backend/.env.development.
# DEV ONLY - refuses to run against any database that isn't named *_dev.
set -e
cd "$(dirname "$0")/../../TMS-Backend"
URL=$(grep '^DATABASE_URL=' .env.development | cut -d= -f2- | tr -d '"')
if [[ ! "$URL" =~ ^mysql://([^:]+):([^@]+)@([^:/]+):([0-9]+)/(.+)$ ]]; then echo "Could not parse DATABASE_URL"; exit 1; fi
U=${BASH_REMATCH[1]}; P=${BASH_REMATCH[2]}; H=${BASH_REMATCH[3]}; PORT=${BASH_REMATCH[4]}; DB=${BASH_REMATCH[5]}
[[ "$DB" == *_dev ]] || { echo "Refusing: '$DB' is not a dev database"; exit 1; }
mysql -u"$U" -p"$P" -h"$H" -P"$PORT" "$DB" 2>/dev/null <<SQL
UPDATE users SET totp_enabled = 0, totp_secret = NULL;
DELETE FROM user_recovery_codes;
UPDATE tenants SET mfa_required = 0;
DELETE FROM tenant_sso_configs;
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE email = 'priya@acme-test.example');
DELETE FROM users WHERE email = 'priya@acme-test.example';
SQL
echo "dev auth/security test state reset ($DB)"
