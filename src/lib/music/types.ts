/**
 * The soundtrack, as a narrow interface.
 *
 * ── THE ONE IDEA, RESTATED FROM db/005 ────────────────────────────────
 * Our catalogue is the source of record. Spotify and Apple are DELIVERY
 * CHANNELS. The curator selects the tracks and writes the arc; a streaming
 * playlist is a rendering of that selection, never its origin. Print renders
 * from the same rows.
 *
 * So this module describes a COURIER, and the interface is deliberately two
 * verbs wide:
 *
 *   resolveTrack   what does this service call this recording?
 *   createPlaylist put this selection, in this order, on this account.
 *
 * Nothing here selects, sequences, scores or recommends. If a method ever
 * appears on this interface that decides what SHOULD be in an evening, the line
 * this whole feature is built on has been crossed.
 *
 * ── WHY THE INTERFACE IS THIS SMALL ───────────────────────────────────
 * Spotify removed Audio Features, Audio Analysis, Recommendations, Related
 * Artists and preview urls from every new application in a single announcement,
 * and will do something like it again. Two verbs is the surface that survives
 * that: search a catalogue and write a playlist are the endpoints a music
 * service cannot remove without ceasing to be one.
 *
 * ── FRAMEWORK-FREE, AND WITHOUT SECRETS ───────────────────────────────
 * This file holds types, errors and pure declarations only — no fetch, no
 * process.env, no "server-only". That is what lets the pure logic beside it
 * (select.ts, spotify-protocol.ts) be unit-tested by `node --test` with no
 * credentials and no network. Everything that touches either lives in
 * spotify.ts, which IS server-only.
 */

/** Where a soundtrack can be delivered. Mirrors soundtrack_delivery in db/005. */
export type SoundtrackDelivery = "spotify" | "apple_music" | "print";

/**
 * The services that have a client behind them. `print` is a real delivery
 * channel but not a courier with an API — it renders from the same tracklist
 * rows, in the printed piece, and needs nothing from this module.
 */
export type MusicService = Exclude<SoundtrackDelivery, "print">;

/**
 * The five parts of an evening, in order. Mirrors arc_segment in db/005, and
 * the ORDER OF THIS ARRAY IS THE ORDER OF THE NIGHT — segmentRank() in
 * select.ts reads it, and the database enforces the same order in
 * tracklist_arc_is_ordered().
 *
 * Authored, never computed. The endpoints that would have supplied tempo and
 * energy are gone for new applications, and their absence costs nothing: which
 * song belongs at the moment the room turns is a taste judgement.
 */
export const ARC_SEGMENTS = [
  "arrival",
  "dinner",
  "moment",
  "late",
  "ending",
] as const;

export type ArcSegment = (typeof ARC_SEGMENTS)[number];

/**
 * One track of a selection, exactly as db/005 holds it.
 *
 * `artist` and `title` are required even when an ISRC is known, because the
 * printed setlist renders from these and must never need a service to be
 * reachable.
 */
export type Track = {
  /** The authored order within the tracklist. 1-based, as in the database. */
  position: number;
  segment: ArcSegment;
  artist: string;
  title: string;
  album?: string | null;
  releaseYear?: number | null;
  durationMs?: number | null;
  /**
   * THE PORTABILITY KEY. Normalised: upper case, no hyphens, twelve
   * characters. Null until resolved — a curator authors an evening without one.
   */
  isrc?: string | null;
  /** The row id in tracklist_track, when this came from the database. */
  id?: string;
};

export type Tracklist = {
  /** tracklist.id, when this came from the database. */
  id?: string;
  /** What the playlist is called on the service. */
  name: string;
  /** One line. Becomes the playlist description; truncated to fit. */
  description?: string;
  tracks: readonly Track[];
};

/** What we ask a catalogue for. */
export type TrackQuery = {
  artist: string;
  title: string;
  album?: string | null;
  /** When known, this is the only field that matters — it cannot be wrong. */
  isrc?: string | null;
  /** Used to reject a match that is the wrong length, e.g. a live version. */
  durationMs?: number | null;
};

/** How a match was arrived at. Mirrors track_resolution.matched_by in db/005. */
export type MatchedBy = "isrc" | "search" | "curator";

/** What a service says a recording is. */
export type ResolvedTrack = {
  /** The service's own identifier. For Spotify, the track URI. */
  externalId: string;
  /** Where a human can listen to exactly this. Not every service has one. */
  url?: string | null;
  /** What the service reports. Null when the service does not carry it. */
  isrc: string | null;
  /** The service's own words, kept so a bad match is auditable. */
  artist: string;
  title: string;
  album?: string | null;
  durationMs?: number | null;
  matchedBy: MatchedBy;
  /** 0 < confidence <= 1. An ISRC hit is 1. */
  confidence: number;
};

/** A track we placed, and what it resolved to. */
export type PlacedTrack = {
  track: Track;
  resolved: ResolvedTrack;
};

/** A track we selected and the service does not have. Recorded, never dropped. */
export type UnresolvedTrack = {
  track: Track;
  /** Why, in a sentence a curator can act on. */
  reason: string;
};

export type CreatePlaylistOptions = {
  /**
   * THE HOUSE ACCOUNT. A PARAMETER, NEVER A CONSTANT.
   *
   * A Spotify account holds about eleven thousand playlists. That ceiling is
   * decades away at any realistic membership and is owed no design hours — but
   * threading the account id through every call is free today and turns "add a
   * second account" into a config change instead of a rewrite. The same
   * parameter is what lets a staging account exist at all.
   */
  accountId: string;
  /** Overrides the tracklist's own name. */
  name?: string;
  description?: string;
  /**
   * Public by default: the entire point of the house account is that she
   * follows a link with no login and no OAuth on her side.
   */
  isPublic?: boolean;
  /**
   * What to do when a track is not in the service's catalogue.
   *
   * Default 'fail', and that is the important default. A sequenced arc with a
   * hole in it is a broken deliverable, and the resolution pass happens BEFORE
   * anything is created — so failing here leaves no half-built playlist on the
   * house account for someone to find later.
   */
  onUnresolved?: "fail" | "omit";
};

export type CreatedPlaylist = {
  service: MusicService;
  accountId: string;
  externalId: string;
  url: string;
  /** In the order they were added. */
  placed: readonly PlacedTrack[];
  /** Non-empty only when onUnresolved was 'omit'. Persist it; never discard it. */
  unresolved: readonly UnresolvedTrack[];
};

/**
 * The courier. One implementation exists (Spotify); an Apple/MusicKit one slots
 * in behind this same interface without touching a caller.
 */
export interface MusicClient {
  readonly service: MusicService;
  /** Null when the catalogue does not have it, or has nothing close enough. */
  resolveTrack(query: TrackQuery): Promise<ResolvedTrack | null>;
  createPlaylist(
    tracklist: Tracklist,
    options: CreatePlaylistOptions
  ): Promise<CreatedPlaylist>;
}

/* ── errors ────────────────────────────────────────────────────────────
 *
 * Same shape as src/lib/email.ts: a missing credential is its own error type,
 * distinguishable from a provider saying no, so a caller can log one at warn
 * and the other at error. Nothing here ever fails quietly.
 */

/** A credential is absent. The feature is off, not broken. */
export class MusicNotConfiguredError extends Error {
  constructor(missing: string) {
    super(
      `${missing} is not set — the soundtrack cannot be delivered to a ` +
        `streaming service. See .env.example.`
    );
    this.name = "MusicNotConfiguredError";
  }
}

/**
 * THE LOUD ONE.
 *
 * A Spotify refresh token lives SIX MONTHS, and refreshing an access token
 * does NOT extend it. When it lapses, every playlist creation fails — and the
 * documented failure mode is that it fails quietly, because nothing else in the
 * system has an opinion about a 400 from a token endpoint.
 *
 * So it gets its own class, its own log line, and a row in
 * tracklist_rendering with status = 'failed'. The fix is always the same and is
 * named in the message: run the authorisation script again.
 */
export class MusicAuthorizationExpiredError extends Error {
  // Declared and assigned rather than written as a constructor parameter
  // property: this file is executed directly by `node --test`, and Node's
  // type-stripping refuses `constructor(readonly x: T)` because erasing it
  // would change what the code DOES, not merely what it declares.
  readonly service: MusicService;

  constructor(service: MusicService, detail: string) {
    super(
      `${service}: the house account's authorisation is no longer valid ` +
        `(${detail}). A refresh token lives six months and refreshing an ` +
        `access token does NOT extend it. Re-authorise now — ` +
        `\`node scripts/spotify-authorize.mjs\` — and replace ` +
        `SPOTIFY_REFRESH_TOKEN. Until then every soundtrack falls back to print.`
    );
    this.name = "MusicAuthorizationExpiredError";
    this.service = service;
  }
}

/** The service answered, and the answer was no. */
export class MusicApiError extends Error {
  readonly status: number;
  readonly service: MusicService;

  constructor(message: string, status: number, service: MusicService) {
    super(`${service}: ${message}`);
    this.name = "MusicApiError";
    this.status = status;
    this.service = service;
  }
}

/**
 * The selection cannot be built on this service as authored. Thrown BEFORE
 * anything is created, so there is never a half-built playlist to clean up.
 */
export class TracksUnresolvedError extends Error {
  readonly unresolved: readonly UnresolvedTrack[];

  constructor(unresolved: readonly UnresolvedTrack[]) {
    super(
      `${unresolved.length} of the selection could not be found in the ` +
        `catalogue: ` +
        unresolved
          .map((u) => `${u.track.artist} — ${u.track.title} (${u.reason})`)
          .join("; ") +
        `. Nothing was created. Correct the selection, or pass ` +
        `onUnresolved: 'omit' to render the evening with the gap.`
    );
    this.name = "TracksUnresolvedError";
    this.unresolved = unresolved;
  }
}

/** A service we have not built a courier for yet. */
export class MusicServiceUnavailableError extends Error {
  constructor(service: string, detail: string) {
    super(`${service}: ${detail}`);
    this.name = "MusicServiceUnavailableError";
  }
}
