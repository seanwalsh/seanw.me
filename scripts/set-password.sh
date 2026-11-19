#!/usr/bin/env bash
# Set the admin password directly with the Supabase secret key. No email needed.
# Usage: ./scripts/set-password.sh   (run in your own terminal; prompts without echoing)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; source .env.local; set +a

read -rsp "New password: " P1; echo
read -rsp "Same password again: " P2; echo
[[ "$P1" == "$P2" ]] || { echo "Passwords don't match."; exit 1; }
[[ ${#P1} -ge 8 ]] || { echo "Use at least 8 characters."; exit 1; }

NEW_PASSWORD="$P1" node --input-type=module -e '
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
const h = { apikey: key, "content-type": "application/json" };
const { users } = await fetch(`${url}/auth/v1/admin/users`, { headers: h }).then(r => r.json());
if (users.length !== 1) { console.error(`Expected 1 user, found ${users.length}.`); process.exit(1); }
const u = users[0];
const r = await fetch(`${url}/auth/v1/admin/users/${u.id}`, {
  method: "PUT", headers: h,
  body: JSON.stringify({ password: process.env.NEW_PASSWORD, email_confirm: true }),
});
if (!r.ok) { console.error("Failed:", r.status, await r.text()); process.exit(1); }
console.log(`Password updated for ${u.email}.`);
'
