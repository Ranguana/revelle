import "server-only";

/**
 * Spotify — one courier behind the MusicClient interface.
 *
 * Deliberately a thin fetch wrapper and NOT the SDK, for the same reason
 * src/lib/email.ts is: the surface used here is four endpoints, and the path
 * that hands a customer's evening to another company is the piece most worth
 * being able to read end to end at two in the morning. An SDK would also pull
 * in the deprecated half of the API as autocomplete, which is an invitation.
 *
 * ── WHAT IS HERE AND WHAT IS NEXT DOOR ────────────────────────────────
 * This file owns exactly two things a test cannot have: CREDENTIALS and a
 * NETWORK. Query building, response parsing, batching and matching all live in
 * spotify-protocol.ts and select.ts, which are pure and are unit-tested. If a
 * change to this file is not about tokens, retries or I/O, it probably belongs
 * in one of those.
 *
 * ── TWO GRANTS, AND WHY THEY FAIL SEPARATELY ──────────────────────────
 *
 *   CLIENT CREDENTIALS  reads the catalogue: search, track lookup. No user is
 *                       involved in asking what a recording is called. Needs
 *                       only the client id and secret, and never expires in the
 *                       sense that matters — a new one is a request away.
 *
 *   AUTHORIZATION CODE  writes to the HOUSE ACCOUNT: create a playlist, add
 *                       tracks. Obtained once by hand with
 *                       scripts/spotify-authorize.mjs, stored as
 *                       SPOTIFY_REFRESH_TOKEN.
 *
 * THE REFRESH TOKEN LIVES SIX MONTHS, AND REFRESHING AN ACCESS TOKEN DOES NOT
 * EXTEND IT. Six months of hourly refreshes end with the same expiry date it
 * started with. When it lapses, playlist creation fails and nothing else in the
 * system has an opinion about a 400 from a token endpoint — which is how this
 * becomes a silent failure. Three things prevent that here: a distinct error
 * class (MusicAuthorizationExpiredError), a loud log line, and an age check
 * that starts complaining a month BEFORE the token dies.
 *
 * ── DEGRADING ─────────────────────────────────────────────────────────
 * With no credentials, isSpotifyConfigured() is false and the caller routes the
 * soundtrack to print — which is a real deliverable, not a failure state. What
 * never happens is a half-built playlist or a silently empty one.
 */

import {
  bestMatch,
  normaliseIsrc,
  orderTracks,
  queryFromTrack,
  type Candidate,
} from "./select.ts";
import {
  LIMITS,
  TOKEN_URL,
  addTracksBodies,
  addTracksUrl,
  apiErrorDetail,
  basicAuth,
  clientCredentialsBody,
  createPlaylistBody,
  createPlaylistUrl,
  isAuthorizationExpired,
  parsePlaylist,
  parseSearchResponse,
  refreshTokenBody,
  retryAfterMs,
  searchUrl,
  toCandidate,
  tokenErrorDetail,
  trackUri,
  trackUrl,
  type TokenResponse,
} from "./spotify-protocol.ts";
import {
  MusicApiError,
  MusicAuthorizationExpiredError,
  MusicNotConfiguredError,
  TracksUnresolvedError,
  type CreatePlaylistOptions,
  type CreatedPlaylist,
  type MusicClient,
  type PlacedTrack,
  type ResolvedTrack,
  type Track,
  type TrackQuery,
  type Tracklist,
  type UnresolvedTrack,
} from "./types.ts";

const SERVICE = "spotify" as const;

/**
 * Access tokens outlive a module instance in development, where Next recreates
 * modules on every edit. Same reasoning as the pool in src/lib/db.ts: without
 * this, a working session asks Spotify for a new token on every save.
 */
declare global {
  var __revelleSpotifyTokens: Map<string, CachedToken> | undefined;
}

type CachedToken = { value: string; expiresAt: number };

function tokenCache(): Map<string, CachedToken> {
  globalThis.__revelleSpotifyTokens ??= new Map();
  return globalThis.__revelleSpotifyTokens;
}

/* ── configuration ─────────────────────────────────────────────────── */

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function required(name: string): string {
  const value = env(name);
  if (!value) throw new MusicNotConfiguredError(name);
  return value;
}

/**
 * Can this house deliver to Spotify at all?
 *
 * The routing question, answered before anything is attempted, so a missing
 * credential produces a printed setlist rather than an exception in a delivery
 * path. Same shape as the RESEND_API_KEY check in src/lib/email.ts: absent
 * configuration is a state, not an error.
 */
export function isSpotifyConfigured(): boolean {
  return Boolean(
    env("SPOTIFY_CLIENT_ID") &&
      env("SPOTIFY_CLIENT_SECRET") &&
      env("SPOTIFY_REFRESH_TOKEN") &&
      env("SPOTIFY_HOUSE_USER_ID")
  );
}

/**
 * The house account, from configuration.
 *
 * Exported so a caller can pass it explicitly. It is never read inside
 * createPlaylist — the account id is a PARAMETER of that call, so a second
 * account, a staging account, or a per-region account is a caller's decision
 * and not a redeploy.
 */
export function houseAccountId(): string {
  return required("SPOTIFY_HOUSE_USER_ID");
}

/** Optional. When set, Spotify returns the pressing playable in that market. */
function market(): string | null {
  return env("SPOTIFY_MARKET") ?? null;
}

/** Days after which the six-month clock is close enough to shout about. */
const REAUTH_WARNING_DAYS = 150;
const REFRESH_TOKEN_LIFETIME_DAYS = 180;

/**
 * THE PRE-WARNING.
 *
 * SPOTIFY_REFRESH_TOKEN_OBTAINED is the date scripts/spotify-authorize.mjs
 * printed. It exists for one purpose: to make the six-month expiry visible a
 * month before it takes a delivery down, because after it lapses the only
 * signal is a failed render and a customer with no music.
 *
 * Optional, and its absence is itself reported once — a house that cannot say
 * when it last authorised cannot be warned, and should know that.
 */
export function authorizationAgeWarning(now: Date = new Date()): string | null {
  const obtained = env("SPOTIFY_REFRESH_TOKEN_OBTAINED");
  if (!obtained) {
    return (
      "SPOTIFY_REFRESH_TOKEN_OBTAINED is not set, so the six-month expiry of " +
      "the house account's refresh token cannot be warned about in advance. " +
      "Set it to the date scripts/spotify-authorize.mjs was last run."
    );
  }

  const then = new Date(obtained);
  if (Number.isNaN(then.getTime())) {
    return `SPOTIFY_REFRESH_TOKEN_OBTAINED is not a date: "${obtained}".`;
  }

  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  if (days < REAUTH_WARNING_DAYS) return null;

  return days >= REFRESH_TOKEN_LIFETIME_DAYS
    ? `The house account's refresh token was issued ${days} days ago and a ` +
        `refresh token lives about ${REFRESH_TOKEN_LIFETIME_DAYS} days. It has ` +
        `probably lapsed. Run \`node scripts/spotify-authorize.mjs\` now.`
    : `The house account's refresh token was issued ${days} days ago and lapses ` +
        `at about ${REFRESH_TOKEN_LIFETIME_DAYS}. Re-authorise before it does: ` +
        `\`node scripts/spotify-authorize.mjs\`.`;
}

/* ── tokens ────────────────────────────────────────────────────────── */

/** A minute of slack, so a token cannot expire between check and use. */
const EXPIRY_SLACK_MS = 60_000;

async function fetchToken(body: string, cacheKey: string): Promise<string> {
  const cached = tokenCache().get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      authorization: basicAuth(
        required("SPOTIFY_CLIENT_ID"),
        required("SPOTIFY_CLIENT_SECRET")
      ),
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  const json = (await res.json().catch(() => null)) as TokenResponse | null;

  if (!res.ok) {
    const detail = tokenErrorDetail(res.status, json);
    if (isAuthorizationExpired(res.status, json)) {
      // THE LOUD FAILURE. Logged here as well as thrown, because the throw is
      // caught by a delivery path that will fall back to print, and the fallback
      // is quiet by design — this line is the only trace left otherwise.
      console.error(
        `[music] SPOTIFY HOUSE ACCOUNT AUTHORISATION HAS LAPSED — ${detail}. ` +
          `Every soundtrack falls back to print until ` +
          `\`node scripts/spotify-authorize.mjs\` is run and ` +
          `SPOTIFY_REFRESH_TOKEN is replaced.`
      );
      throw new MusicAuthorizationExpiredError(SERVICE, detail);
    }
    throw new MusicApiError(detail, res.status, SERVICE);
  }

  if (!json?.access_token) {
    throw new MusicApiError("no access token in response", res.status, SERVICE);
  }

  // Spotify MAY return a new refresh token on a refresh, and dropping it
  // silently is how a house account expires early for no visible reason.
  // Nothing here can write an environment variable, so it says so instead.
  if (json.refresh_token && json.refresh_token !== env("SPOTIFY_REFRESH_TOKEN")) {
    console.warn(
      "[music] Spotify issued a NEW refresh token. Store it as " +
        "SPOTIFY_REFRESH_TOKEN and update SPOTIFY_REFRESH_TOKEN_OBTAINED to " +
        "today, or the six-month clock keeps running from the old one."
    );
  }

  const ttl = (json.expires_in ?? 3600) * 1000;
  tokenCache().set(cacheKey, {
    value: json.access_token,
    expiresAt: Date.now() + ttl - EXPIRY_SLACK_MS,
  });
  return json.access_token;
}

/** Reads the catalogue. No user, no house account, nothing to expire. */
function catalogueToken(): Promise<string> {
  return fetchToken(clientCredentialsBody(), "client_credentials");
}

/** Writes to the house account. This is the one that lapses. */
async function accountToken(): Promise<string> {
  const warning = authorizationAgeWarning();
  if (warning) console.warn(`[music] ${warning}`);
  return fetchToken(
    refreshTokenBody(required("SPOTIFY_REFRESH_TOKEN")),
    "refresh_token"
  );
}

/* ── requests ──────────────────────────────────────────────────────── */

const MAX_ATTEMPTS = 3;

/**
 * One API call, with the two retries that are worth having: a 429 waits out
 * the Retry-After Spotify sends, and a 5xx is retried once because it is
 * usually nothing. Everything else fails immediately — retrying a 400 just
 * makes the same mistake three times.
 */
async function call(
  url: string,
  init: RequestInit & { token: string }
): Promise<unknown> {
  const { token, ...rest } = init;

  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(url, {
      ...rest,
      headers: {
        ...(rest.headers as Record<string, string> | undefined),
        authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      // 201 with an empty body is legal on some of these.
      const text = await res.text();
      return text ? (JSON.parse(text) as unknown) : null;
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < MAX_ATTEMPTS) {
      const wait =
        res.status === 429
          ? retryAfterMs(res.headers.get("retry-after"))
          : 500 * attempt;
      await new Promise((resolve) => setTimeout(resolve, wait));
      continue;
    }

    const json = await res.json().catch(() => null);
    if (res.status === 401 || res.status === 403) {
      // A write rejected for authorisation, after a token was successfully
      // obtained, means the SCOPE is wrong — which is a re-authorisation, not a
      // retry. The message says which scope, because the alternative is an
      // afternoon.
      throw new MusicAuthorizationExpiredError(
        SERVICE,
        `${apiErrorDetail(json, res.status)} — the house account may not be ` +
          `authorised for playlist-modify-public`
      );
    }
    throw new MusicApiError(apiErrorDetail(json, res.status), res.status, SERVICE);
  }
}

/* ── the client ────────────────────────────────────────────────────── */

class SpotifyClient implements MusicClient {
  readonly service = SERVICE;

  /**
   * What does Spotify call this recording?
   *
   * Two paths, and the difference between them is the whole reliability story:
   *
   *   WITH AN ISRC   an exact lookup that cannot return the wrong recording.
   *                  Confidence 1, matched_by 'isrc'.
   *   WITHOUT ONE    a word search, scored by select.ts, and rejected unless it
   *                  clears the bar on artist AND title AND duration. A near
   *                  miss returns null, because a curator answering "which of
   *                  these two is it" costs ten seconds and a karaoke cover in
   *                  a delivered playlist costs the evening.
   *
   * The second path then reads the ISRC back off the match, so the NEXT render
   * of the same track takes the first path. The catalogue is the source of
   * record; this is how it learns the key that makes it portable.
   */
  async resolveTrack(query: TrackQuery): Promise<ResolvedTrack | null> {
    const token = await catalogueToken();
    const wanted = normaliseIsrc(query.isrc);

    const json = await call(searchUrl(query, market()), {
      method: "GET",
      token,
    });
    const candidates = parseSearchResponse(json);
    if (candidates.length === 0) return null;

    if (wanted) {
      // An ISRC search returns only recordings carrying that code, so the first
      // is as good as any — but it is verified rather than assumed, because a
      // search that quietly ignored the filter would otherwise be trusted
      // absolutely.
      const exact = candidates.find((c) => normaliseIsrc(c.isrc) === wanted);
      if (exact) return resolved(exact, "isrc", 1);
      return null;
    }

    const match = bestMatch(query, candidates);
    if (!match) return null;

    // Search results do not reliably carry external_ids, so the ISRC is read
    // from the track endpoint. Missing it is not fatal — the match still
    // stands — but it is the key that makes the next render exact and the
    // selection portable to Apple, so it is always asked for.
    const withIsrc = await this.readIsrc(match.candidate, token);
    return resolved(withIsrc, "search", match.score);
  }

  private async readIsrc(
    candidate: Candidate,
    token: string
  ): Promise<Candidate> {
    if (normaliseIsrc(candidate.isrc)) return candidate;
    try {
      const full = toCandidate(
        await call(trackUrl(candidate.externalId, market()), {
          method: "GET",
          token,
        })
      );
      return full?.isrc ? { ...candidate, isrc: full.isrc } : candidate;
    } catch {
      // An ISRC we could not read is a missing convenience, not a failed
      // delivery. The match is already made.
      return candidate;
    }
  }

  /**
   * Put this selection, in this order, on this account.
   *
   * Order of operations is the design:
   *
   *   1. Order and de-duplicate the selection (pure, select.ts).
   *   2. Resolve EVERY track first.
   *   3. If anything is unresolved and onUnresolved is 'fail' (the default),
   *      throw — BEFORE anything exists on the house account. A failed render
   *      leaves no orphan playlist for somebody to find in a year.
   *   4. Create the playlist, then add in batches of a hundred, SEQUENTIALLY.
   *      Spotify appends, so concurrency here would shuffle the evening.
   */
  async createPlaylist(
    tracklist: Tracklist,
    options: CreatePlaylistOptions
  ): Promise<CreatedPlaylist> {
    if (!options.accountId) {
      throw new MusicNotConfiguredError("accountId (the house account)");
    }

    const tracks = orderTracks([...tracklist.tracks]);
    const placed: PlacedTrack[] = [];
    const unresolved: UnresolvedTrack[] = [];
    const seen = new Set<string>();

    for (const track of tracks) {
      const found = await this.resolveTrack(queryFromTrack(track));
      if (!found) {
        unresolved.push({
          track,
          reason: "not found in Spotify's catalogue, or nothing close enough",
        });
        continue;
      }
      // Two selections resolving to one recording would put the same song in
      // the evening twice; Spotify accepts that happily, which is why it is
      // caught here.
      if (seen.has(found.externalId)) {
        unresolved.push({
          track,
          reason: `resolves to the same recording as an earlier track (${found.externalId})`,
        });
        continue;
      }
      seen.add(found.externalId);
      placed.push({ track, resolved: found });
    }

    if (unresolved.length > 0 && (options.onUnresolved ?? "fail") === "fail") {
      throw new TracksUnresolvedError(unresolved);
    }
    if (placed.length === 0) {
      throw new TracksUnresolvedError(
        unresolved.length > 0
          ? unresolved
          : tracks.map((track) => ({ track, reason: "the selection is empty" }))
      );
    }

    const token = await accountToken();

    const created = parsePlaylist(
      await call(createPlaylistUrl(options.accountId), {
        method: "POST",
        token,
        headers: { "content-type": "application/json" },
        body: createPlaylistBody({
          name: options.name ?? tracklist.name,
          description: options.description ?? tracklist.description,
          isPublic: options.isPublic,
        }),
      })
    );

    if (!created) {
      throw new MusicApiError(
        "playlist created but the response carried no id or url",
        200,
        SERVICE
      );
    }

    const uris = placed.map((p) => trackUri(p.resolved.externalId));
    for (const body of addTracksBodies(uris)) {
      await call(addTracksUrl(created.externalId), {
        method: "POST",
        token,
        headers: { "content-type": "application/json" },
        body,
      });
    }

    console.log(
      `[music] spotify playlist ${created.externalId} on account ` +
        `${options.accountId}: ${placed.length} placed` +
        (unresolved.length > 0 ? `, ${unresolved.length} unresolved` : "") +
        ` (batches of ${LIMITS.urisPerAdd})`
    );

    return {
      service: SERVICE,
      accountId: options.accountId,
      externalId: created.externalId,
      url: created.url,
      placed,
      unresolved,
    };
  }
}

function resolved(
  candidate: Candidate,
  matchedBy: ResolvedTrack["matchedBy"],
  confidence: number
): ResolvedTrack {
  return {
    externalId: candidate.externalId,
    url: candidate.url ?? null,
    isrc: normaliseIsrc(candidate.isrc),
    artist: candidate.artist,
    title: candidate.title,
    album: candidate.album ?? null,
    durationMs: candidate.durationMs ?? null,
    matchedBy,
    confidence,
  };
}

/** One instance is enough; it holds no per-call state. */
export const spotify: MusicClient = new SpotifyClient();

/** Re-exported so a caller can build a selection without importing two files. */
export type { Track, Tracklist };
