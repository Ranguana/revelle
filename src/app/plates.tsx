import type { ReactNode } from "react";

/**
 * The artwork. Flat-vector posters for the library, engraved line icons for the
 * occasions — hand-authored SVG, no raster assets and no photography.
 *
 * Separated from src/lib/library.ts on the same principle that separates the
 * palette from the copy: that file is content a curator edits, this one is
 * presentation, and they meet on a slug.
 *
 * ── Why the fills are custom properties ──────────────────────────────
 *
 * Nothing here names a colour. Every fill reads a token, so a poster cannot
 * drift away from the house palette and a destination can one day supply its
 * own set and repaint its own plate.
 *
 * The posters are PRINTED OBJECTS: cream paper on a permanently dark shelf.
 * They must not invert with the reader's colour scheme, so the frame that holds
 * each one pins the light palette — see the light-pinned token block in
 * src/app/page.tsx and `.plateFrame` in landing.module.css. `--gold-lit` is the
 * one colour the token set has no name for (brass catching the sun) and it is
 * mixed from `--gold` in the stylesheet rather than invented here.
 */

/** Poster art, keyed by the slug in src/lib/library.ts. 300x400, 3:4. */
export const POSTERS: Record<string, ReactNode> = {
  "cote-dazur": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="196" cy="132" r="58" fill="var(--gold)" />
      <rect y="252" width="300" height="98" fill="var(--aqua)" />
      <rect y="272" width="300" height="2" fill="var(--bone)" opacity="0.5" />
      <rect y="300" width="300" height="2" fill="var(--bone)" opacity="0.35" />
      <rect y="330" width="300" height="2" fill="var(--bone)" opacity="0.25" />
      <rect y="350" width="300" height="50" fill="var(--ground2)" />
      <path d="M232 252 L246 220 L260 252 Z" fill="var(--bone)" />
      <path d="M96 352 C86 300 84 240 82 186" stroke="var(--oxblood)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <g transform="translate(82 182)" fill="var(--night)">
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" />
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" transform="rotate(52)" />
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" transform="rotate(104)" fill="var(--aqua)" />
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" transform="scale(-1 1)" />
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" transform="scale(-1 1) rotate(52)" />
        <path d="M0 0 C -18 -13 -46 -17 -72 -5 C -48 7 -20 11 0 6 Z" transform="scale(-1 1) rotate(104)" fill="var(--aqua)" />
      </g>
      <circle cx="82" cy="182" r="5" fill="var(--oxblood)" />
    </>
  ),
  "portofino": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="86" cy="96" r="34" fill="var(--gold-lit)" />
      <path d="M300 208 L300 96 L214 158 L166 132 L96 200 Z" fill="var(--night)" opacity="0.9" />
      <g>
        <rect x="28" y="212" width="42" height="76" fill="var(--oxblood)" />
        <rect x="74" y="192" width="34" height="96" fill="var(--ground2)" />
        <rect x="112" y="224" width="46" height="64" fill="var(--gold)" />
        <rect x="162" y="200" width="36" height="88" fill="var(--bone)" stroke="var(--night)" strokeWidth="1.5" />
        <rect x="202" y="230" width="50" height="58" fill="var(--oxblood)" opacity="0.85" />
        <g fill="var(--night)" opacity="0.65">
          <rect x="40" y="230" width="8" height="12" /><rect x="54" y="230" width="8" height="12" />
          <rect x="86" y="212" width="8" height="12" /><rect x="86" y="240" width="8" height="12" />
          <rect x="126" y="244" width="8" height="12" /><rect x="140" y="244" width="8" height="12" />
          <rect x="174" y="220" width="8" height="12" /><rect x="216" y="250" width="8" height="12" />
        </g>
      </g>
      <rect y="288" width="300" height="112" fill="var(--aqua)" />
      <g fill="var(--bone)" opacity="0.4">
        <rect x="28" y="302" width="42" height="2" /><rect x="112" y="316" width="46" height="2" />
        <rect x="202" y="302" width="50" height="2" /><rect x="74" y="336" width="34" height="2" />
        <rect x="162" y="352" width="36" height="2" />
      </g>
      <g>
        <path d="M120 372 L196 372 L186 388 L130 388 Z" fill="var(--bone)" />
        <rect x="156" y="316" width="2.5" height="56" fill="var(--bone)" />
        <path d="M160 322 L160 366 L192 366 Z" fill="var(--oxblood)" />
      </g>
    </>
  ),
  "cap-ferrat": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <rect y="150" width="300" height="250" fill="var(--aqua)" />
      <rect y="150" width="300" height="2" fill="var(--night)" opacity="0.5" />
      <path d="M0 400 L0 214 C64 214 116 260 150 400 Z" fill="var(--ground2)" />
      <path d="M0 400 L0 258 C48 262 88 300 112 400 Z" fill="var(--oxblood)" />
      <g fill="var(--night)">
        <path d="M40 216 C48 216 50 190 44 168 C38 190 32 216 40 216 Z" />
        <path d="M68 222 C77 222 79 192 72 166 C65 192 59 222 68 222 Z" />
        <path d="M96 236 C104 236 106 212 100 190 C94 212 88 236 96 236 Z" />
      </g>
      <g>
        <path d="M186 268 A54 54 0 0 1 294 268 Z" fill="var(--bone)" />
        <path d="M240 214 A54 54 0 0 1 267 221 L240 268 Z" fill="var(--oxblood)" />
        <path d="M186 268 A54 54 0 0 1 213 221 L240 268 Z" fill="var(--oxblood)" />
        <rect x="238.5" y="268" width="3" height="88" fill="var(--night)" />
      </g>
      <circle cx="242" cy="112" r="30" fill="none" stroke="var(--gold)" strokeWidth="3" />
    </>
  ),
  "new-orleans": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <rect x="16" y="40" width="268" height="300" fill="var(--ground2)" />
      <g fill="var(--oxblood)">
        <path d="M46 172 A26 26 0 0 1 98 172 L98 236 L46 236 Z" />
        <path d="M124 172 A26 26 0 0 1 176 172 L176 236 L124 236 Z" />
        <path d="M202 172 A26 26 0 0 1 254 172 L254 236 L202 236 Z" />
      </g>
      <g stroke="var(--bone)" strokeWidth="2" opacity="0.85">
        <path d="M60 176 L60 232 M84 176 L84 232 M138 176 L138 232 M162 176 L162 232 M216 176 L216 232 M240 176 L240 232" />
      </g>
      <rect x="16" y="240" width="268" height="8" fill="var(--night)" />
      <path d="M16.00 254 A11.17 11.17 0 0 1 38.33 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M38.33 254 A11.17 11.17 0 0 1 60.67 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M60.67 254 A11.17 11.17 0 0 1 83.00 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M83.00 254 A11.17 11.17 0 0 1 105.33 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M105.33 254 A11.17 11.17 0 0 1 127.67 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M127.67 254 A11.17 11.17 0 0 1 150.00 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M150.00 254 A11.17 11.17 0 0 1 172.33 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M172.33 254 A11.17 11.17 0 0 1 194.67 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M194.67 254 A11.17 11.17 0 0 1 217.00 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M217.00 254 A11.17 11.17 0 0 1 239.33 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M239.33 254 A11.17 11.17 0 0 1 261.67 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <path d="M261.67 254 A11.17 11.17 0 0 1 284.00 254" fill="none" stroke="var(--aqua)" strokeWidth="2.5" />
      <rect x="16" y="264" width="268" height="6" fill="var(--night)" />
      <g fill="var(--gold)">
        <circle cx="150" cy="92" r="16" />
        <rect x="148.5" y="40" width="3" height="38" />
      </g>
      <rect y="340" width="300" height="60" fill="var(--night)" />
      <g stroke="var(--bone)" strokeWidth="1.5" opacity="0.35">
        <path d="M0 362 H300 M0 382 H300 M40 340 L40 400 M110 340 L110 400 M180 340 L180 400 M250 340 L250 400" />
      </g>
    </>
  ),
  "port-clyde": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="238" cy="76" r="30" fill="var(--gold)" opacity="0.9" />
      <rect y="256" width="300" height="144" fill="var(--aqua)" />
      <g fill="var(--bone)" opacity="0.4">
        <rect y="286" width="300" height="2" /><rect y="322" width="300" height="2" /><rect y="360" width="300" height="2" />
      </g>
      <g fill="var(--night)">
        <rect x="66" y="256" width="8" height="86" /><rect x="112" y="256" width="8" height="98" />
        <rect x="176" y="256" width="8" height="90" /><rect x="214" y="256" width="8" height="102" />
      </g>
      <rect x="46" y="176" width="196" height="82" fill="var(--oxblood)" />
      <path d="M46 176 L144 118 L242 176 Z" fill="var(--night)" />
      <g fill="var(--bone)">
        <rect x="76" y="200" width="34" height="34" />
        <rect x="180" y="200" width="34" height="34" />
        <rect x="130" y="196" width="28" height="62" />
      </g>
      <g stroke="var(--bone)" strokeWidth="1.5" opacity="0.3">
        <path d="M46 214 H242 M46 238 H242" />
      </g>
      <g>
        <rect x="252" y="292" width="18" height="30" rx="9" fill="var(--gold)" />
        <rect x="252" y="302" width="18" height="6" fill="var(--oxblood)" />
        <rect x="24" y="330" width="16" height="26" rx="8" fill="var(--bone)" />
        <rect x="24" y="338" width="16" height="6" fill="var(--oxblood)" />
      </g>
    </>
  ),
  "las-vegas": (
    <>
      <rect width="300" height="400" fill="var(--night)" />
      <g stroke="var(--gold)" strokeWidth="2" opacity="0.7">
        <path d="M258 60 L258 34 M258 60 L282 46 M258 60 L282 74 M258 60 L234 46" />
      </g>
      <rect x="84" y="86" width="132" height="180" fill="var(--bone)" />
      <circle cx="84" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="106" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="106" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="128" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="128" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="150" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="150" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="172" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="172" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="194" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="194" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="86" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="266" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="108" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="108" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="130" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="130" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="152" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="152" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="174" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="174" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="196" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="196" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="218" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="218" r="4.5" fill="var(--gold-lit)" />
      <circle cx="84" cy="240" r="4.5" fill="var(--gold-lit)" />
      <circle cx="216" cy="240" r="4.5" fill="var(--gold-lit)" />
      <g fill="var(--oxblood)">
        <rect x="104" y="118" width="92" height="14" />
        <rect x="104" y="146" width="66" height="14" />
      </g>
      <g fill="var(--aqua)">
        <rect x="104" y="180" width="92" height="10" />
        <rect x="104" y="202" width="52" height="10" />
        <rect x="104" y="224" width="74" height="10" />
      </g>
      <rect x="146" y="266" width="8" height="54" fill="var(--bone)" />
      <path d="M110 320 L190 320 L150 372 Z" fill="var(--oxblood)" />
      <g fill="var(--gold-lit)">
        <circle cx="124" cy="330" r="4" /><circle cx="150" cy="330" r="4" /><circle cx="176" cy="330" r="4" />
        <circle cx="138" cy="348" r="4" /><circle cx="162" cy="348" r="4" /><circle cx="150" cy="364" r="4" />
      </g>
    </>
  ),
  "new-york": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="228" cy="72" r="26" fill="var(--gold-lit)" />
      <g fill="var(--night)">
        <rect x="0" y="196" width="58" height="204" />
        <rect x="64" y="152" width="66" height="248" />
        <rect x="136" y="232" width="52" height="168" />
        <rect x="194" y="180" width="48" height="220" />
        <rect x="248" y="248" width="52" height="152" />
      </g>
      <rect x="86" y="120" width="22" height="32" fill="var(--oxblood)" />
      <g fill="var(--oxblood)">
        <path d="M198 148 L238 148 L232 172 L204 172 Z" />
        <rect x="206" y="172" width="4" height="10" /><rect x="226" y="172" width="4" height="10" />
        <rect x="216" y="132" width="4" height="16" />
      </g>
      <g fill="var(--gold)" opacity="0.9">
        <rect x="12" y="216" width="10" height="14" /><rect x="34" y="216" width="10" height="14" />
        <rect x="12" y="252" width="10" height="14" /><rect x="34" y="288" width="10" height="14" />
        <rect x="76" y="176" width="10" height="14" /><rect x="100" y="176" width="10" height="14" />
        <rect x="76" y="212" width="10" height="14" /><rect x="100" y="248" width="10" height="14" />
        <rect x="148" y="256" width="10" height="14" /><rect x="168" y="292" width="10" height="14" />
        <rect x="204" y="204" width="10" height="14" /><rect x="222" y="240" width="10" height="14" />
        <rect x="260" y="272" width="10" height="14" /><rect x="280" y="308" width="10" height="14" />
      </g>
      <rect y="382" width="300" height="18" fill="var(--aqua)" />
    </>
  ),
};

/**
 * Occasion icons, keyed by slug. 64x64, 1.25px strokes — engraved rather than
 * drawn, so four of them in a row read as one set and not as clip art.
 *
 * These sit on the light ground and use the ordinary tokens, so they follow the
 * reader's colour scheme the way the text around them does.
 */
export const OCCASION_ICONS: Record<string, ReactNode> = {
  getaway: (
    <>
      <path
        d="M32 6 C43 6 51 15 51 25 C51 34 41 41 35 44 L29 44 C23 41 13 34 13 25 C13 15 21 6 32 6 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path
        d="M32 6 C26 16 26 34 29 44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="0.9"
        opacity="0.7"
      />
      <path
        d="M32 6 C38 16 38 34 35 44"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="0.9"
        opacity="0.7"
      />
      <path d="M13 25 H51" stroke="var(--gold)" strokeWidth="0.9" opacity="0.8" />
      <path
        d="M27 50 H37 L35.5 58 H28.5 Z"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M29 44 L29 50 M35 44 L35 50" stroke="var(--aqua)" strokeWidth="1" />
    </>
  ),
  "weekend-away": (
    <>
      <rect
        x="9"
        y="20"
        width="46"
        height="32"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M9 29 H55" stroke="var(--oxblood)" strokeWidth="0.9" opacity="0.75" />
      <path d="M22 20 V52 M42 20 V52" stroke="var(--gold)" strokeWidth="1" />
      <rect
        x="29"
        y="31"
        width="6"
        height="5"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.1"
      />
      <path
        d="M25 20 V15 H39 V20"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.25"
      />
      <path d="M9 52 H55" stroke="var(--oxblood)" strokeWidth="1.25" />
    </>
  ),
  "long-dinner": (
    <>
      <path
        d="M14 14 H50 C50 30 42 38 32 38 C22 38 14 30 14 14 Z"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <path d="M18 20 H46" stroke="var(--gold)" strokeWidth="0.9" opacity="0.85" />
      <path d="M32 38 V52" stroke="var(--aqua)" strokeWidth="1.25" />
      <path d="M22 54 H42" stroke="var(--aqua)" strokeWidth="1.25" />
      <circle
        cx="44"
        cy="12"
        r="3.5"
        fill="none"
        stroke="var(--aqua)"
        strokeWidth="1.1"
      />
    </>
  ),
  birthday: (
    <>
      <circle
        cx="32"
        cy="32"
        r="14"
        fill="none"
        stroke="var(--oxblood)"
        strokeWidth="1.25"
      />
      <circle cx="32" cy="32" r="8" fill="var(--gold)" opacity="0.3" />
      <g stroke="var(--gold)" strokeWidth="1.1">
        <path d="M32 6 V16 M32 48 V58 M6 32 H16 M48 32 H58" />
        <path
          d="M13.6 13.6 L20.7 20.7 M43.3 43.3 L50.4 50.4 M50.4 13.6 L43.3 20.7 M20.7 43.3 L13.6 50.4"
          opacity="0.75"
        />
      </g>
    </>
  ),
};
