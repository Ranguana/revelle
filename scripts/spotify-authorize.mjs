#!/usr/bin/env node
/**
 * Authorise the HOUSE SPOTIFY ACCOUNT. Once, by hand.
 *
 *   npm run spotify:authorize      walk the consent flow, print a refresh token
 *   npm run spotify:verify         check the stored one without changing anything
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT THIS IS FOR
 *
 * Two grants are used against Spotify, and only one of them needs a human:
 *
 *   CLIENT CREDENTIALS  reads the catalogue (search, track lookup). Needs the
 *                       client id and secret and nothing else. No consent
 *                       screen, no account, nothing to expire.
 *
 *   AUTHORIZATION CODE  writes to the house account: create a public playlist,
 *                       add tracks in order. Requires a person to sign in ONCE
 *                       as the société's own Spotify account and consent. What
 *                       comes back is a refresh token, and that token is what
 *                       the running application uses forever after.
 *
 * The customer never sees any of this. She follows a link to a public playlist
 * on the house account — no login, no OAuth, no account of her own. That is the
 * whole reason the house account exists, and this script is the one moment a
 * human is required.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⚠ THE SIX-MONTH CLOCK — READ THIS BEFORE YOU CLOSE THE WINDOW
 *
 * A Spotify refresh token lives about SIX MONTHS, and REFRESHING AN ACCESS
 * TOKEN DOES NOT EXTEND IT. Six months of the application quietly renewing
 * hourly access tokens ends on exactly the day the refresh token was always
 * going to die.
 *
 * When it lapses, playlist creation fails. It fails in a place nobody is
 * looking, on a Tuesday, for a customer whose evening is on Saturday.
 *
 * Three things exist to stop that being a surprise, and all three depend on
 * this script being run again before the date it prints:
 *
 *   1. SPOTIFY_REFRESH_TOKEN_OBTAINED — set it to the date printed below. The
 *      client starts warning in the log a month before the expiry.
 *   2. `npm run spotify:verify` — run it on a schedule. It exits non-zero when
 *      the token is dead or nearly, which is a thing a cron can shout about.
 *   3. tracklist_rendering rows with status = 'failed' — every failed handover
 *      is a row, so the failure is visible in the database and not only in a
 *      log. See db/005.
 *
 * ─────────────────────────────────────────────────────────────────────
 * BEFORE RUNNING THIS, THE FOUNDER NEEDS, IN THIS ORDER
 *
 *   1. A Spotify account that IS the house — not a personal one. Its user id
 *      becomes SPOTIFY_HOUSE_USER_ID and every playlist ever sent to a customer
 *      lives in it. Spotify Premium is not required to CREATE playlists; it is
 *      required to LISTEN to one in order on mobile, which is her side of the
 *      arrangement, not ours.
 *   2. An application at https://developer.spotify.com/dashboard, created
 *      while signed in as that account. It gives a Client ID and a Client
 *      Secret → SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET.
 *   3. In that application's settings, a Redirect URI of exactly:
 *
 *          http://127.0.0.1:8888/callback
 *
 *      The literal loopback IP, not "localhost" — Spotify stopped accepting
 *      localhost for new redirect URIs, and the error it gives says only
 *      INVALID_CLIENT: Invalid redirect URI.
 *   4. This script, run on a machine with a browser.
 *
 * Nothing else in Revelle depends on a developer's machine. This does, once,
 * because a consent screen is a human being clicking a button — and the output
 * is an environment variable that then lives in Render like every other secret.
 */
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  REQUIRED_SCOPES,
  SPOTIFY_API,
  TOKEN_URL,
  authorizationCodeBody,
  authorizeUrl,
  basicAuth,
  isAuthorizationExpired,
  refreshTokenBody,
  tokenErrorDetail,
} from "../src/lib/music/spotify-protocol.ts";

/**
 * The same request shaping the running application uses — imported, not
 * re-implemented. A script that builds its own token request is a script that
 * can succeed while the application fails.
 */

const REDIRECT_URI =
  process.env.SPOTIFY_REDIRECT_URI || "http://127.0.0.1:8888/callback";

const verifyOnly = process.argv.includes("--verify");

/** Credentials live in .env.local, which is never committed and never printed. */
const ENV_FILE = fileURLToPath(new URL("../.env.local", import.meta.url));
if (existsSync(ENV_FILE)) {
  try {
    process.loadEnvFile(ENV_FILE);
    console.log("[spotify] read .env.local");
  } catch (err) {
    console.warn(`[spotify] could not read .env.local: ${err.message}`);
  }
}

function fail(message) {
  console.error(`\n[spotify] FAILED: ${message}`);
  process.exit(1);
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(
      `${name} is not set. Put it in .env.local (see .env.example) or pass it ` +
        `on the command line: ${name}=... npm run spotify:authorize`
    );
  }
  return value;
}

const clientId = required("SPOTIFY_CLIENT_ID");
const clientSecret = required("SPOTIFY_CLIENT_SECRET");

async function postToken(body) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      authorization: basicAuth(clientId, clientSecret),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, json };
}

async function whoAmI(accessToken) {
  const res = await fetch(`${SPOTIFY_API}/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

const today = new Date().toISOString().slice(0, 10);

function expiryLine(fromIso) {
  const from = new Date(fromIso);
  const expires = new Date(from.getTime() + 180 * 86_400_000);
  return expires.toISOString().slice(0, 10);
}

/* ── --verify ──────────────────────────────────────────────────────────
 *
 * Answers one question — is the house account still authorised — and answers it
 * with an exit code, so a scheduled run of this is an alarm rather than a
 * report nobody opens. It creates nothing and changes nothing.
 */
if (verifyOnly) {
  const refreshToken = required("SPOTIFY_REFRESH_TOKEN");
  const { ok, status, json } = await postToken(refreshTokenBody(refreshToken));

  if (!ok) {
    const detail = tokenErrorDetail(status, json);
    if (isAuthorizationExpired(status, json)) {
      console.error(
        `\n[spotify] ⚠  THE HOUSE ACCOUNT'S AUTHORISATION HAS LAPSED — ${detail}\n` +
          `\n  Every soundtrack is falling back to a printed setlist until this` +
          `\n  is fixed. It is not a code problem and no deploy will help.\n` +
          `\n  Fix it now:  npm run spotify:authorize\n`
      );
      process.exit(2);
    }
    fail(`could not refresh the access token — ${detail}`);
  }

  const me = await whoAmI(json.access_token);
  const obtained = process.env.SPOTIFY_REFRESH_TOKEN_OBTAINED?.trim();

  console.log("\n[spotify] the house account is authorised.");
  console.log(`  account          ${me?.id ?? "(could not read /v1/me)"}`);
  console.log(`  scopes granted   ${json.scope ?? "(not reported)"}`);
  console.log(`  access token     valid for ${json.expires_in ?? "?"}s`);

  if (json.refresh_token && json.refresh_token !== refreshToken) {
    console.log(
      `\n  ⚠  Spotify issued a NEW refresh token. Store it, or the six-month` +
        `\n     clock keeps running from the old one:\n` +
        `\n     SPOTIFY_REFRESH_TOKEN=${json.refresh_token}` +
        `\n     SPOTIFY_REFRESH_TOKEN_OBTAINED=${today}\n`
    );
  }

  if (!obtained) {
    console.log(
      `\n  ⚠  SPOTIFY_REFRESH_TOKEN_OBTAINED is not set, so nothing can warn` +
        `\n     you before the six-month expiry. Set it to the date you last` +
        `\n     ran the authorisation.\n`
    );
    process.exit(0);
  }

  const days = Math.floor(
    (Date.now() - new Date(obtained).getTime()) / 86_400_000
  );
  console.log(`  issued           ${obtained} (${days} days ago)`);
  console.log(`  lapses at about  ${expiryLine(obtained)}`);

  if (days >= 150) {
    console.error(
      `\n[spotify] ⚠  RE-AUTHORISE NOW. A refresh token lives about 180 days` +
        `\n             and refreshing an access token does not extend it.` +
        `\n             Run: npm run spotify:authorize\n`
    );
    process.exit(3);
  }

  console.log("\n[spotify] nothing to do.\n");
  process.exit(0);
}

/* ── the consent flow ─────────────────────────────────────────────────
 *
 * A one-request web server on the loopback address, purely to catch the
 * redirect. It exists for as long as the flow takes and then stops.
 */

const state = randomUUID();
const url = authorizeUrl({
  clientId,
  redirectUri: REDIRECT_URI,
  state,
  scopes: REQUIRED_SCOPES,
});

const port = Number(new URL(REDIRECT_URI).port || 80);
const path = new URL(REDIRECT_URI).pathname;

console.log(
  `\n[spotify] Sign in as THE HOUSE ACCOUNT — not a personal one — and approve.` +
    `\n          Everything created here is public and permanent.\n` +
    `\n          Scope requested: ${REQUIRED_SCOPES.join(", ")}` +
    `\n          Redirect URI:    ${REDIRECT_URI}` +
    `\n                           (must match the dashboard EXACTLY)\n` +
    `\n  Open this:\n\n${url}\n`
);

const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const incoming = new URL(req.url, `http://127.0.0.1:${port}`);
    if (incoming.pathname !== path) {
      res.writeHead(404).end();
      return;
    }

    const returned = incoming.searchParams.get("state");
    const error = incoming.searchParams.get("error");
    const received = incoming.searchParams.get("code");

    const done = (heading, body) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(
        `<!doctype html><meta charset="utf-8">` +
          `<title>Revelle Société</title>` +
          `<body style="margin:0;padding:64px 32px;background:#EFE3D2;color:#2A2018;` +
          `font-family:Georgia,'Times New Roman',serif;line-height:1.6">` +
          `<div style="max-width:34rem;margin:0 auto">` +
          `<p style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;` +
          `text-transform:uppercase;color:#8E8173;margin:0 0 28px">Revelle Société</p>` +
          `<p style="font-size:26px;line-height:1.2;margin:0 0 24px">${heading}</p>` +
          `<p style="margin:0;color:#5E5245">${body}</p></div></body>`
      );
      server.close();
    };

    if (error) {
      done("That did not go through.", "The terminal has the details.");
      reject(new Error(`Spotify returned "${error}"`));
      return;
    }
    // A mismatched state means the response is not the one this run asked for.
    // Refusing it is the whole reason the parameter exists.
    if (returned !== state) {
      done("That did not go through.", "The terminal has the details.");
      reject(new Error("state did not match — ignoring this response"));
      return;
    }
    if (!received) {
      done("That did not go through.", "The terminal has the details.");
      reject(new Error("no code in the callback"));
      return;
    }

    done("The house account is authorised.", "Go back to the terminal.");
    resolve(received);
  });

  server.on("error", reject);
  // 127.0.0.1 explicitly: this must not be reachable from the network, and the
  // literal loopback address is also what Spotify requires in the redirect URI.
  server.listen(port, "127.0.0.1", () => {
    console.log(`[spotify] waiting on ${REDIRECT_URI} …\n`);
  });
}).catch((err) => fail(err.message));

const { ok, status, json } = await postToken(
  authorizationCodeBody({ code, redirectUri: REDIRECT_URI })
);

if (!ok) fail(`the code could not be exchanged — ${tokenErrorDetail(status, json)}`);
if (!json?.refresh_token) {
  fail(
    "Spotify returned no refresh token. That happens when the application is " +
      "configured for a public client (PKCE) rather than a confidential one. " +
      "Use the Client Secret."
  );
}

const me = await whoAmI(json.access_token);

console.log(
  `\n────────────────────────────────────────────────────────────────────` +
    `\n  PUT THESE IN .env.local, AND IN RENDER'S ENVIRONMENT.` +
    `\n  Do not commit them. Do not paste them into a chat window.` +
    `\n────────────────────────────────────────────────────────────────────\n`
);
console.log(`SPOTIFY_REFRESH_TOKEN=${json.refresh_token}`);
console.log(`SPOTIFY_REFRESH_TOKEN_OBTAINED=${today}`);
if (me?.id) console.log(`SPOTIFY_HOUSE_USER_ID=${me.id}`);
else {
  console.log(
    `# SPOTIFY_HOUSE_USER_ID=  (could not read /v1/me — take it from the ` +
      `account's profile url)`
  );
}

console.log(
  `\n  Granted: ${json.scope ?? REQUIRED_SCOPES.join(", ")}` +
    `\n  Account: ${me?.display_name ?? "(unknown)"}\n` +
    `\n────────────────────────────────────────────────────────────────────` +
    `\n  ⚠  THIS EXPIRES ON OR ABOUT ${expiryLine(today)}.` +
    `\n` +
    `\n  A refresh token lives about six months and REFRESHING AN ACCESS` +
    `\n  TOKEN DOES NOT EXTEND IT. On that date, playlist creation stops` +
    `\n  working and every soundtrack falls back to a printed setlist.` +
    `\n` +
    `\n  Put a reminder in the calendar for ${expiryLine(today)}, and put` +
    `\n  \`npm run spotify:verify\` on a schedule — it exits non-zero when` +
    `\n  the token is dead or within a month of it.` +
    `\n────────────────────────────────────────────────────────────────────\n`
);
