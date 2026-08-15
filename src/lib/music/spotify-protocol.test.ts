/**
 * Spotify's wire format, tested without Spotify.
 *
 *   npm test
 *
 * These are the mistakes that are cheap here and expensive in production: a
 * search query that matches an album instead of an artist, a batch of 120 uris
 * sent to an endpoint that takes 100, a response field read from the wrong
 * place, a 400 that was actually a lapsed authorisation. None of them needs a
 * credential to catch.
 */
import assert from "node:assert/strict";
import test from "node:test";

import {
  LIMITS,
  REQUIRED_SCOPES,
  addTracksBodies,
  addTracksUrl,
  apiErrorDetail,
  authorizationCodeBody,
  authorizeUrl,
  basicAuth,
  clientCredentialsBody,
  createPlaylistBody,
  createPlaylistUrl,
  isAuthorizationExpired,
  parsePlaylist,
  parseSearchResponse,
  refreshTokenBody,
  releaseYear,
  retryAfterMs,
  searchQuery,
  searchUrl,
  toCandidate,
  tokenErrorDetail,
  trackId,
  trackUri,
  trackUrl,
} from "./spotify-protocol.ts";

/* ── authorisation ─────────────────────────────────────────────────── */

test("basicAuth is the client id and secret, base64", () => {
  assert.equal(basicAuth("id", "secret"), "Basic aWQ6c2VjcmV0");
});

test("the two grants ask for the two different things", () => {
  assert.equal(clientCredentialsBody(), "grant_type=client_credentials");
  assert.equal(
    refreshTokenBody("tok en"),
    "grant_type=refresh_token&refresh_token=tok+en"
  );
  assert.equal(
    authorizationCodeBody({ code: "c", redirectUri: "http://127.0.0.1:8888/callback" }),
    "grant_type=authorization_code&code=c&redirect_uri=http%3A%2F%2F127.0.0.1%3A8888%2Fcallback"
  );
});

test("the consent url asks for exactly one scope and forces the dialog", () => {
  const url = new URL(
    authorizeUrl({
      clientId: "abc",
      redirectUri: "http://127.0.0.1:8888/callback",
      state: "s1",
    })
  );
  assert.equal(url.origin + url.pathname, "https://accounts.spotify.com/authorize");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "s1");
  assert.equal(url.searchParams.get("scope"), "playlist-modify-public");
  assert.equal(url.searchParams.get("show_dialog"), "true");
  assert.deepEqual([...REQUIRED_SCOPES], ["playlist-modify-public"]);
});

test("a lapsed refresh token is told apart from an ordinary bad request", () => {
  // This is the whole alarm. Spotify answers a dead refresh token with a 400
  // that looks like any other 400 unless the body is read.
  assert.equal(isAuthorizationExpired(400, { error: "invalid_grant" }), true);
  assert.equal(isAuthorizationExpired(401, null), true);
  assert.equal(isAuthorizationExpired(400, { error: "invalid_request" }), false);
  assert.equal(isAuthorizationExpired(429, null), false);
  assert.equal(isAuthorizationExpired(500, null), false);
});

test("tokenErrorDetail prefers the service's own words", () => {
  assert.equal(
    tokenErrorDetail(400, { error: "invalid_grant", error_description: "Refresh token revoked" }),
    "Refresh token revoked"
  );
  assert.equal(tokenErrorDetail(400, { error: "invalid_grant" }), "invalid_grant");
  assert.equal(tokenErrorDetail(503, null), "HTTP 503");
});

test("retryAfterMs reads seconds, defaults sanely, and is capped", () => {
  assert.equal(retryAfterMs("2"), 2_000);
  assert.equal(retryAfterMs(null), 1_000);
  assert.equal(retryAfterMs("not a number"), 1_000);
  assert.equal(retryAfterMs("100000"), 30_000, "a render fails usefully rather than hanging");
});

/* ── the catalogue ─────────────────────────────────────────────────── */

test("an ISRC search asks for nothing but the ISRC", () => {
  assert.equal(
    searchQuery({ artist: "Nina Simone", title: "Feeling Good", isrc: "gb-aye-06-00301" }),
    "isrc:GBAYE0600301",
    "words could only drag a different pressing into the results"
  );
});

test("a word search names which words are which", () => {
  assert.equal(
    searchQuery({ artist: "Nina Simone", title: "Feeling Good" }),
    'track:"Feeling Good" artist:"Nina Simone"'
  );
});

test("a quote in a title cannot terminate the field filter", () => {
  const q = searchQuery({ artist: 'The "Band"', title: 'She Said "No"' });
  assert.equal(q, 'track:"She Said  No" artist:"The  Band"');
  assert.equal((q.match(/"/g) ?? []).length, 4, "exactly the four filter quotes");
});

test("searchUrl asks for tracks, a small page, and a market only when set", () => {
  const url = new URL(searchUrl({ artist: "Chic", title: "Le Freak" }));
  assert.equal(url.origin + url.pathname, "https://api.spotify.com/v1/search");
  assert.equal(url.searchParams.get("type"), "track");
  assert.equal(url.searchParams.get("limit"), String(LIMITS.searchResults));
  assert.equal(url.searchParams.get("q"), 'track:"Le Freak" artist:"Chic"');
  assert.equal(url.searchParams.get("market"), null);

  const scoped = new URL(searchUrl({ artist: "Chic", title: "Le Freak" }, "US"));
  assert.equal(scoped.searchParams.get("market"), "US");
});

test("trackUrl takes either form of an identifier", () => {
  assert.equal(trackUrl("abc"), "https://api.spotify.com/v1/tracks/abc");
  assert.equal(trackUrl("spotify:track:abc"), "https://api.spotify.com/v1/tracks/abc");
  assert.equal(trackUrl("abc", "GB"), "https://api.spotify.com/v1/tracks/abc?market=GB");
});

test("uris and ids convert both ways, idempotently", () => {
  assert.equal(trackUri("abc"), "spotify:track:abc");
  assert.equal(trackUri("spotify:track:abc"), "spotify:track:abc");
  assert.equal(trackId("spotify:track:abc"), "abc");
  assert.equal(trackId("abc"), "abc");
});

const searchResponse = {
  tracks: {
    items: [
      {
        id: "1",
        uri: "spotify:track:1",
        name: "Água de Beber",
        duration_ms: 162_000,
        external_ids: { isrc: "USVE10300123" },
        external_urls: { spotify: "https://open.spotify.com/track/1" },
        artists: [{ name: "Astrud Gilberto" }, { name: "Stan Getz" }],
        album: { name: "Getz/Gilberto", release_date: "1964-03-01" },
      },
      { id: "2", name: "No artists at all" },
      null,
      { id: "3" },
    ],
  },
};

test("parseSearchResponse reads a track object without trusting its shape", () => {
  const candidates = parseSearchResponse(searchResponse);
  assert.equal(candidates.length, 2, "the null and the nameless one are dropped");

  const [first] = candidates;
  assert.equal(first.externalId, "spotify:track:1");
  assert.equal(first.isrc, "USVE10300123");
  assert.equal(first.title, "Água de Beber");
  assert.equal(
    first.artist,
    "Astrud Gilberto, Stan Getz",
    "every credited artist, so a query naming one of them still scores"
  );
  assert.equal(first.album, "Getz/Gilberto");
  assert.equal(first.durationMs, 162_000);
  assert.equal(first.url, "https://open.spotify.com/track/1");
});

test("parseSearchResponse survives anything that is not a search response", () => {
  assert.deepEqual(parseSearchResponse(null), []);
  assert.deepEqual(parseSearchResponse({}), []);
  assert.deepEqual(parseSearchResponse({ tracks: {} }), []);
  assert.deepEqual(parseSearchResponse({ tracks: { items: "no" } }), []);
  assert.deepEqual(parseSearchResponse("<html>a proxy error page</html>"), []);
});

test("a malformed ISRC on the wire does not become a stored one", () => {
  const [candidate] = parseSearchResponse({
    tracks: { items: [{ id: "1", name: "x", external_ids: { isrc: "nonsense" } }] },
  });
  assert.equal(candidate.isrc, null);
});

test("toCandidate and releaseYear read one track object", () => {
  const track = searchResponse.tracks.items[0];
  assert.equal(toCandidate(track)?.externalId, "spotify:track:1");
  assert.equal(releaseYear(track), 1964);
  assert.equal(releaseYear({ album: { release_date: "1978" } }), 1978);
  assert.equal(releaseYear({}), null);
  assert.equal(releaseYear(null), null);
});

/* ── writing a playlist ────────────────────────────────────────────── */

test("the house account id is a parameter, and it is escaped", () => {
  assert.equal(
    createPlaylistUrl("revelle_house"),
    "https://api.spotify.com/v1/users/revelle_house/playlists"
  );
  assert.equal(
    createPlaylistUrl("a b/c"),
    "https://api.spotify.com/v1/users/a%20b%2Fc/playlists"
  );
});

test("addTracksUrl takes a playlist id in either form", () => {
  assert.equal(
    addTracksUrl("37i9dQ"),
    "https://api.spotify.com/v1/playlists/37i9dQ/tracks"
  );
  assert.equal(
    addTracksUrl("spotify:playlist:37i9dQ"),
    "https://api.spotify.com/v1/playlists/37i9dQ/tracks"
  );
});

test("a playlist is public by default — she follows a link, with no login", () => {
  const body = JSON.parse(createPlaylistBody({ name: "THE LONG LUNCH" }));
  assert.equal(body.public, true);
  assert.equal(body.name, "THE LONG LUNCH");
  assert.equal(body.description, "");

  assert.equal(JSON.parse(createPlaylistBody({ name: "x", isPublic: false })).public, false);
});

test("a name and a description are cut to the service's limits", () => {
  const body = JSON.parse(
    createPlaylistBody({
      name: "N".repeat(400),
      description: "word ".repeat(200),
    })
  );
  assert.ok(body.name.length <= LIMITS.playlistName);
  assert.ok(body.description.length <= LIMITS.playlistDescription);
});

test("tracks are added a hundred at a time, in order", () => {
  const uris = Array.from({ length: 250 }, (_, i) => `id${i}`);
  const bodies = addTracksBodies(uris).map((b) => JSON.parse(b).uris as string[]);

  assert.deepEqual(
    bodies.map((batch) => batch.length),
    [100, 100, 50],
    `the endpoint takes ${LIMITS.urisPerAdd}`
  );
  assert.equal(bodies[0][0], "spotify:track:id0", "bare ids become uris");
  assert.equal(bodies[2][49], "spotify:track:id249");
  // Order is the product: flattening the batches must give back the evening.
  assert.deepEqual(
    bodies.flat(),
    uris.map((id) => `spotify:track:${id}`)
  );
});

test("an empty selection produces no calls at all", () => {
  assert.deepEqual(addTracksBodies([]), []);
});

test("parsePlaylist keeps the two things worth keeping", () => {
  assert.deepEqual(
    parsePlaylist({ id: "p1", external_urls: { spotify: "https://open.spotify.com/playlist/p1" } }),
    { externalId: "p1", url: "https://open.spotify.com/playlist/p1" }
  );
  assert.equal(parsePlaylist({ id: "p1" }), null, "an id with no link is not a delivery");
  assert.equal(parsePlaylist(null), null);
});

test("apiErrorDetail prefers Spotify's own message", () => {
  assert.equal(apiErrorDetail({ error: { message: "Invalid track uri" } }, 400), "Invalid track uri");
  assert.equal(apiErrorDetail(null, 502), "HTTP 502");
});
