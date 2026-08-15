import "server-only";

/**
 * The soundtrack's front door.
 *
 * A caller asks for a courier by name and gets one, or gets a clear reason why
 * not. It never asks for Spotify by importing Spotify — that indirection is the
 * whole point of the interface, and it is what makes an Apple/MusicKit
 * implementation a new file rather than an edit to every delivery path.
 *
 * ── ROUTING, WHICH IS NOT THIS MODULE'S DECISION ──────────────────────
 * How a given customer's soundtrack should be delivered is her answer, held in
 * quiz_response.music_service and read through the revelle_soundtrack view in
 * db/005, coalesced to 'print' when she never said. This module only knows how
 * to carry a selection once somebody has decided where it goes.
 *
 * `print` is deliberately not a MusicClient. It is a real delivery channel —
 * for a woman with no subscription it is the whole soundtrack — but it renders
 * from tracklist_track in the printed piece and needs nothing from an API.
 * Giving it a client that returns a fake url would put a lie in the type.
 */

import { isSpotifyConfigured, spotify } from "./spotify.ts";
import {
  MusicNotConfiguredError,
  MusicServiceUnavailableError,
  type MusicClient,
  type MusicService,
  type SoundtrackDelivery,
} from "./types.ts";

export * from "./types.ts";
export {
  arcViolations,
  dedupeByIsrc,
  isIsrc,
  normaliseIsrc,
  orderTracks,
  queryFromTrack,
  segmentRank,
} from "./select.ts";
export { authorizationAgeWarning, houseAccountId, isSpotifyConfigured } from "./spotify.ts";

/**
 * Is there a courier for this service, configured and ready?
 *
 * Asked BEFORE a delivery is attempted, so that a house with no Spotify
 * credentials routes the soundtrack to print — a real deliverable — instead of
 * failing in the middle of a delivery. Same shape as the missing-Resend-key
 * path in src/lib/email.ts: absent configuration is a state, not an error.
 */
export function canDeliver(service: SoundtrackDelivery): boolean {
  switch (service) {
    case "print":
      // Always. It is the only channel that cannot fail for a reason outside
      // this house, which is why it is the fallback for every other one.
      return true;
    case "spotify":
      return isSpotifyConfigured();
    case "apple_music":
      return false;
    default:
      return false;
  }
}

/**
 * The courier for a service.
 *
 * Throws rather than returning null: a caller that has already routed to a
 * streaming service and finds no client has a bug or a missing credential, and
 * both deserve a sentence. Use canDeliver() to route.
 */
export function musicClient(service: MusicService): MusicClient {
  switch (service) {
    case "spotify":
      if (!isSpotifyConfigured()) {
        throw new MusicNotConfiguredError(
          "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET / SPOTIFY_REFRESH_TOKEN / SPOTIFY_HOUSE_USER_ID"
        );
      }
      return spotify;

    case "apple_music":
      // WHERE THE APPLE IMPLEMENTATION GOES, AND WHAT IT WILL NEED.
      //
      // A new file, ./apple-music.ts, exporting an object that satisfies
      // MusicClient, plus one case here. Nothing else in this repo changes:
      // db/005 already holds 'apple_music' as a soundtrack_delivery value,
      // track_resolution already keys on (track, service), and
      // tracklist_rendering already records which service rendered what.
      //
      // The honest warning, so that nobody plans around a symmetry that does
      // not exist: MusicKit is NOT shaped like this. Spotify lets a house
      // account own a public playlist that anybody can open with no login,
      // which is why the Spotify route asks nothing of her. Apple Music has no
      // equivalent — a playlist created through the Apple Music API is created
      // in a USER'S library and requires a Music User Token obtained from that
      // user's own device, on top of a developer token signed with a MusicKit
      // private key. So the Apple route will need either one tap of
      // authorisation from her in a browser, or the printed setlist. That is a
      // product decision, not an implementation detail, and it should be made
      // before the file is written.
      throw new MusicServiceUnavailableError(
        "apple_music",
        "no client yet. See the note in src/lib/music/index.ts — MusicKit " +
          "cannot publish from a house account the way Spotify can, so this " +
          "route needs a product decision before it needs code. Deliver the " +
          "printed setlist in the meantime."
      );

    default:
      throw new MusicServiceUnavailableError(service, "unknown service");
  }
}
