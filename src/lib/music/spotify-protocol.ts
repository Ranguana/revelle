/**
 * Spotify's wire format: how a request is shaped and how an answer is read.
 *
 * Pure. No fetch, no process.env, no secrets, no "server-only" — which is the
 * whole reason it is a separate file from spotify.ts. The interesting mistakes
 * in an integration like this are made HERE (a mis-built search query, a
 * response field read from the wrong place, a batch of 120 ids sent to an
 * endpoint that takes 100), and they are exactly the mistakes that are cheap to
 * test and expensive to discover in production. Everything in this file is
 * covered by src/lib/music/spotify-protocol.test.ts without a network call.
 *
 * ── ENDPOINTS USED, AND THE ONES DELIBERATELY NOT ─────────────────────
 *
 *   GET  /v1/search                    find a recording
 *   GET  /v1/tracks?ids=               read external_ids.isrc for a batch
 *   POST /v1/users/{id}/playlists      create, on the HOUSE account
 *   POST /v1/playlists/{id}/tracks     add, in order, 100 at a time
 *
 * Not used, and not to be added: Audio Features, Audio Analysis,
 * Recommendations, Related Artists, Featured Playlists, Category Playlists, and
 * the 30-second preview url. All of them return 403 for applications created
 * after November 2024 — they are not deprecated in the sense of "will stop
 * working eventually", they do not work now. The arc is authored instead; see
 * db/005.
 */

import { chunk, normaliseIsrc, truncate, type Candidate } from "./select.ts";
import type { TrackQuery } from "./types.ts";

export const SPOTIFY_ACCOUNTS = "https://accounts.spotify.com";
export const SPOTIFY_API = "https://api.spotify.com/v1";

/**
 * Service limits, in one place so a caller cannot half-remember one.
 * Exceeding any of them is a 400 with a message that does not name the limit.
 */
export const LIMITS = {
  /** Ids per /v1/tracks call. */
  tracksPerLookup: 50,
  /** URIs per POST to /v1/playlists/{id}/tracks. */
  urisPerAdd: 100,
  /** Results asked of /v1/search. More than a handful is noise. */
  searchResults: 10,
  /** Characters. Spotify silently truncates beyond this; we do it visibly. */
  playlistName: 100,
  playlistDescription: 300,
} as const;

/** The scope the house account is authorised with. Nothing more is asked for. */
export const REQUIRED_SCOPES = ["playlist-modify-public"] as const;

/* ── authorisation ─────────────────────────────────────────────────── */

/** HTTP Basic, as both token grants require. */
export function basicAuth(clientId: string, clientSecret: string): string {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

export const TOKEN_URL = `${SPOTIFY_ACCOUNTS}/api/token`;
export const AUTHORIZE_URL = `${SPOTIFY_ACCOUNTS}/authorize`;

/**
 * Client Credentials. Used for everything that only reads the CATALOGUE —
 * search and track lookup — because no user is involved in asking what a
 * recording is called. It is also the grant that keeps working when the house
 * account's refresh token lapses, which is why resolution and rendering fail
 * separately and only one of them is an emergency.
 */
export function clientCredentialsBody(): string {
  return new URLSearchParams({ grant_type: "client_credentials" }).toString();
}

/**
 * Authorization Code refresh. Used for everything that WRITES to the house
 * account. The refresh token is obtained once, by hand, with
 * scripts/spotify-authorize.mjs.
 */
export function refreshTokenBody(refreshToken: string): string {
  return new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  }).toString();
}

/** The one-time consent url. Built here so the script and the client agree. */
export function authorizeUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: readonly string[];
}): string {
  const params = new URLSearchParams({
    client_id: input.clientId,
    response_type: "code",
    redirect_uri: input.redirectUri,
    state: input.state,
    scope: (input.scopes ?? REQUIRED_SCOPES).join(" "),
    // Force the consent screen even if this account has authorised before.
    // Without it, re-running the script on an already-authorised account
    // returns a code silently bound to the OLD scope set.
    show_dialog: "true",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

export function authorizationCodeBody(input: {
  code: string;
  redirectUri: string;
}): string {
  return new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    redirect_uri: input.redirectUri,
  }).toString();
}

export type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

/**
 * IS THE HOUSE ACCOUNT'S AUTHORISATION GONE?
 *
 * Spotify answers a dead refresh token with 400 and `invalid_grant`, which is
 * indistinguishable from an ordinary bad request unless you look. This is the
 * function that looks, and it is the difference between an alarm and a silence.
 *
 * A refresh token lives six months and REFRESHING AN ACCESS TOKEN DOES NOT
 * EXTEND IT. A house account that has been quietly renewing access tokens every
 * hour for six months stops working on a Tuesday for no reason anybody has
 * changed.
 */
export function isAuthorizationExpired(
  status: number,
  body: TokenResponse | null
): boolean {
  if (status === 401) return true;
  if (status !== 400) return false;
  return body?.error === "invalid_grant";
}

/** The error text a service returned, or the status if it did not say. */
export function tokenErrorDetail(
  status: number,
  body: TokenResponse | null
): string {
  if (body?.error_description) return body.error_description;
  if (body?.error) return body.error;
  return `HTTP ${status}`;
}

/**
 * How long to wait after a 429. Spotify sends Retry-After in SECONDS, and has
 * been observed sending very large values during sustained abuse; the cap keeps
 * a render from hanging for an hour rather than failing usefully.
 */
export function retryAfterMs(
  headerValue: string | null,
  capMs = 30_000
): number {
  // Number(null) is 0 and Number("") is 0, so an absent header would otherwise
  // mean "retry immediately" — which is how a 429 becomes a tight loop against
  // a service that has just asked us to stop.
  if (headerValue === null || headerValue.trim() === "") return 1_000;
  const seconds = Number(headerValue);
  if (!Number.isFinite(seconds) || seconds <= 0) return 1_000;
  return Math.min(seconds * 1_000, capMs);
}

/* ── the catalogue ─────────────────────────────────────────────────── */

/**
 * The search string.
 *
 * With an ISRC this is exact and cannot be nearly-right, so nothing else is
 * sent: adding the title as well would only let a fuzzy field filter drag a
 * different pressing into the results.
 *
 * Without one, the field filters are used rather than a bare phrase. `track:"…"
 * artist:"…"` tells Spotify which words are which; the same words as free text
 * match an album called "Nina Simone" as readily as the artist.
 *
 * Double quotes inside a title would terminate the filter, so they are dropped
 * rather than escaped — Spotify's query language has no escape for them.
 */
export function searchQuery(query: TrackQuery): string {
  const isrc = normaliseIsrc(query.isrc);
  if (isrc) return `isrc:${isrc}`;

  const clean = (value: string) => value.replace(/"/g, " ").trim();
  return `track:"${clean(query.title)}" artist:"${clean(query.artist)}"`;
}

export function searchUrl(query: TrackQuery, market?: string | null): string {
  const params = new URLSearchParams({
    q: searchQuery(query),
    type: "track",
    limit: String(LIMITS.searchResults),
  });
  // Optional on purpose. A market makes Spotify return the pressing that is
  // actually playable there, which is what we want when we know it — but a
  // wrong market hides catalogue that exists, so an unset value is left unset.
  if (market) params.set("market", market);
  return `${SPOTIFY_API}/search?${params.toString()}`;
}

/**
 * One recording, read in full — this is where external_ids.isrc lives. Search
 * results do not reliably carry it, and the ISRC is the key that makes a
 * selection portable, so it is read back for anything matched on words.
 *
 * The batch form (/v1/tracks?ids=a,b,c, up to LIMITS.tracksPerLookup at a time)
 * is deliberately not written yet: nothing in the product resolves a whole
 * catalogue at once, and an untested batching path is worth less than the two
 * lines it would save. When a bulk "resolve this soundtrack" pass exists, it is
 * this function plus chunk().
 */
export function trackUrl(id: string, market?: string | null): string {
  const params = new URLSearchParams();
  if (market) params.set("market", market);
  const query = params.toString();
  return `${SPOTIFY_API}/tracks/${encodeURIComponent(trackId(id))}${
    query ? `?${query}` : ""
  }`;
}

/** 'spotify:track:6rqhFgbbKwnb9MLmUQDhG6' — what the add endpoint takes. */
export function trackUri(id: string): string {
  return id.startsWith("spotify:") ? id : `spotify:track:${id}`;
}

/** The bare id, from either form. */
export function trackId(uriOrId: string): string {
  const parts = uriOrId.split(":");
  return parts.length === 3 ? parts[2] : uriOrId;
}

/**
 * Spotify's track object, as much of it as is read. Everything optional,
 * because a shape assumption is how an integration breaks silently: a missing
 * field must produce a candidate we can score and reject, not a thrown
 * TypeError halfway through a render.
 */
type SpotifyTrack = {
  id?: string;
  uri?: string;
  name?: string;
  duration_ms?: number;
  external_ids?: { isrc?: string };
  external_urls?: { spotify?: string };
  artists?: { name?: string }[];
  album?: { name?: string; release_date?: string };
};

/**
 * One track object → the service-neutral shape the matcher scores. Takes
 * `unknown` because it is reading somebody else's JSON: a missing or reshaped
 * field must produce null, not a TypeError halfway through a render.
 */
export function toCandidate(value: unknown): Candidate | null {
  const track = value as SpotifyTrack | null;
  const id = track?.uri ?? track?.id;
  if (!track || !id || !track.name) return null;
  return {
    externalId: trackUri(id),
    url: track.external_urls?.spotify ?? null,
    isrc: normaliseIsrc(track.external_ids?.isrc),
    title: track.name,
    // Every credited artist, joined, so "Astrud Gilberto, Stan Getz" still
    // scores against a query naming only one of them.
    artist: (track.artists ?? [])
      .map((a) => a?.name ?? "")
      .filter(Boolean)
      .join(", "),
    album: track.album?.name ?? null,
    durationMs: typeof track.duration_ms === "number" ? track.duration_ms : null,
  };
}

export function parseSearchResponse(json: unknown): Candidate[] {
  const items = (json as { tracks?: { items?: SpotifyTrack[] } })?.tracks?.items;
  if (!Array.isArray(items)) return [];
  return items
    .map(toCandidate)
    .filter((candidate): candidate is Candidate => candidate !== null);
}

/** The release year, from Spotify's variable-precision release_date. */
export function releaseYear(value: unknown): number | null {
  const date = (value as SpotifyTrack | null)?.album?.release_date;
  if (typeof date !== "string") return null;
  const year = Number(date.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

/* ── writing a playlist ────────────────────────────────────────────── */

export function createPlaylistUrl(accountId: string): string {
  // The account id is a PARAMETER. When the first house account reaches its
  // ceiling, a second one is a config change and this line does not move.
  return `${SPOTIFY_API}/users/${encodeURIComponent(accountId)}/playlists`;
}

export function addTracksUrl(playlistId: string): string {
  return `${SPOTIFY_API}/playlists/${encodeURIComponent(trackId(playlistId))}/tracks`;
}

export function createPlaylistBody(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
}): string {
  return JSON.stringify({
    name: truncate(input.name, LIMITS.playlistName),
    description: truncate(input.description ?? "", LIMITS.playlistDescription),
    // Public by default: she follows a link, with no login and no OAuth on her
    // side. That is the entire reason the house account exists.
    public: input.isPublic ?? true,
  });
}

/**
 * The add-tracks calls, in order, already batched.
 *
 * ORDER IS THE PRODUCT. Spotify appends each batch to the end of the playlist,
 * so these must be sent one after another and never concurrently — a Promise.all
 * over them would shuffle the evening, which is the one thing that must not
 * happen to a sequenced arc.
 */
export function addTracksBodies(uris: readonly string[]): string[] {
  return chunk(uris.map(trackUri), LIMITS.urisPerAdd).map((batch) =>
    JSON.stringify({ uris: batch })
  );
}

export type SpotifyPlaylist = {
  id?: string;
  external_urls?: { spotify?: string };
};

/** The two things we keep from a created playlist. Null if either is missing. */
export function parsePlaylist(
  json: unknown
): { externalId: string; url: string } | null {
  const playlist = json as SpotifyPlaylist | null;
  const externalId = playlist?.id;
  const url = playlist?.external_urls?.spotify;
  if (!externalId || !url) return null;
  return { externalId, url };
}

/** The message Spotify put in an error body, or the status if it did not. */
export function apiErrorDetail(json: unknown, status: number): string {
  const message = (json as { error?: { message?: string } })?.error?.message;
  return message || `HTTP ${status}`;
}
