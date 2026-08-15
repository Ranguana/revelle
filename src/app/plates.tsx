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
  "nantucket": (
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

  /*
   * The three below came in as finished SVG rather than being drawn here, and
   * they arrived already speaking the house palette — every fill in the source
   * was one of the seven colours this file has a token for. The literals are
   * swapped for tokens on the way in, per the rule at the top: a poster that
   * names a colour is a poster that can drift.
   *
   *   #FBF4E7 bone   #E3C9A4 ground2   #C9922F gold   #E8A13A gold-lit
   *   #1F6B7A aqua   #16242C night     #A83E24 oxblood
   *
   * The originals are kept verbatim in public/destinations/ so the art can be
   * re-cut without reverse-engineering it back out of JSX.
   */
  "big-sur": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <rect y="0" width="300" height="196" fill="var(--ground2)" />
      <circle cx="76" cy="62" r="30" fill="var(--gold-lit)" />
      <rect y="196" width="300" height="204" fill="var(--aqua)" />
      <g fill="var(--bone)" opacity="0.35">
        <rect y="232" width="300" height="2" />
        <rect y="268" width="300" height="2" />
        <rect y="312" width="300" height="2" />
      </g>
      <path d="M0 196 L0 108 C62 112 104 148 132 196 Z" fill="var(--night)" />
      <path d="M300 196 L300 128 C258 136 226 160 208 196 Z" fill="var(--night)" />
      <g fill="var(--oxblood)">
        <rect x="104" y="176" width="118" height="8" />
        <path d="M112 184 A34 34 0 0 1 180 184 L172 184 A26 26 0 0 0 120 184 Z" />
        <rect x="112" y="184" width="5" height="16" />
        <rect x="146" y="184" width="5" height="10" />
        <rect x="176" y="184" width="5" height="16" />
        <rect x="206" y="184" width="6" height="20" />
      </g>
      <path
        d="M0 108 C40 120 74 148 96 188"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        strokeDasharray="7 6"
      />
      <g fill="var(--night)">
        <path d="M28 132 C36 132 38 112 32 94 C26 112 20 132 28 132 Z" />
        <path d="M54 148 C62 148 64 130 58 112 C52 130 46 148 54 148 Z" />
      </g>
      <g fill="var(--bone)" opacity="0.9">
        <path d="M212 340 C232 332 252 336 268 348 C246 344 228 344 212 350 Z" />
        <path d="M40 372 C62 364 84 368 100 380 C76 374 58 376 40 382 Z" />
      </g>
    </>
  ),

  "catskills": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="70" cy="58" r="24" fill="var(--gold)" />
      <path
        d="M0 214 C58 168 104 186 150 166 C202 144 250 160 300 140 L300 214 Z"
        fill="var(--aqua)"
        opacity="0.45"
      />
      <path
        d="M0 246 C54 200 108 220 156 198 C208 174 254 192 300 172 L300 246 Z"
        fill="var(--aqua)"
        opacity="0.75"
      />
      <path
        d="M0 286 C50 240 110 262 162 238 C214 214 258 232 300 210 L300 286 Z"
        fill="var(--night)"
      />
      <g
        stroke="var(--oxblood)"
        strokeWidth="2.25"
        fill="none"
        strokeLinecap="square"
      >
        <path d="M212 226 L219 160 M244 226 L237 160" />
        <path d="M215 198 L241 198 M217 179 L239 179" />
        <path d="M216 213 L240 213" />
      </g>
      <rect x="212" y="155" width="32" height="5" fill="var(--oxblood)" />
      <path d="M210 155 L228 140 L246 155 Z" fill="var(--oxblood)" />
      <rect y="286" width="300" height="114" fill="var(--ground2)" />
      <g>
        <path d="M56 350 L92 292 L128 350 Z" fill="var(--oxblood)" />
        <path d="M78 350 L92 322 L106 350 Z" fill="var(--bone)" />
        <rect x="52" y="350" width="80" height="6" fill="var(--night)" />
      </g>
      <g fill="var(--night)">
        <path d="M184 336 L170 336 L184 292 L198 336 Z" />
        <rect x="182" y="336" width="4" height="10" />
        <path d="M216 344 L204 344 L216 306 L228 344 Z" />
        <rect x="214" y="344" width="4" height="9" />
        <path d="M250 336 L236 336 L250 292 L264 336 Z" />
        <rect x="248" y="336" width="4" height="10" />
      </g>
      <g
        stroke="var(--night)"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 7"
        strokeLinecap="round"
      >
        <path d="M22 386 C62 374 46 356 88 346" />
      </g>
      <g fill="var(--gold)">
        <circle cx="150" cy="366" r="4" />
        <circle cx="166" cy="382" r="4" />
        <circle cx="134" cy="384" r="4" />
      </g>
    </>
  ),

  "dolomites": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="222" cy="70" r="26" fill="var(--gold)" />
      <path
        d="M0 268 L58 152 L104 218 L150 118 L214 240 L246 196 L300 268 Z"
        fill="var(--night)"
      />
      <path d="M150 118 L128 152 L172 152 Z" fill="var(--bone)" />
      <path d="M58 152 L44 178 L74 178 Z" fill="var(--bone)" />
      <path d="M246 196 L236 214 L258 214 Z" fill="var(--bone)" />
      <path
        d="M0 268 L300 268 L300 292 L0 292 Z"
        fill="var(--aqua)"
        opacity="0.25"
      />
      <path d="M14 104 L286 60" stroke="var(--oxblood)" strokeWidth="1.5" />
      <g transform="translate(150 86) rotate(-9)">
        <rect x="-17" y="-2" width="34" height="22" fill="var(--oxblood)" />
        <rect x="-17" y="4" width="34" height="3" fill="var(--bone)" opacity="0.9" />
        <rect x="-2" y="-12" width="4" height="10" fill="var(--night)" />
      </g>
      <rect y="292" width="300" height="108" fill="var(--ground2)" />
      <g>
        <rect x="36" y="316" width="72" height="46" fill="var(--oxblood)" />
        <path d="M26 316 L72 288 L118 316 Z" fill="var(--night)" />
        <rect x="54" y="330" width="18" height="18" fill="var(--bone)" />
        <rect x="80" y="330" width="14" height="18" fill="var(--gold)" />
        <rect x="36" y="362" width="72" height="5" fill="var(--night)" />
      </g>
      <g
        stroke="var(--night)"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="8 7"
        strokeLinecap="round"
      >
        <path d="M140 386 C176 372 158 348 196 336 C222 328 220 310 240 302" />
      </g>
      <g fill="var(--aqua)">
        <path d="M236 300 C244 300 246 278 240 258 C234 278 228 300 236 300 Z" />
        <path d="M266 308 C275 308 277 284 270 262 C263 284 257 308 266 308 Z" />
      </g>
    </>
  ),

  /*
   * The only plate whose subject is the EMPTY MIDDLE of a room.
   *
   * Havana's night has two halves and the hinge between them is furniture: the
   * table is carried back against the wall after the flan, and what is left is
   * a cleared floor. So the table is at the edge with the coffee on it, a chair
   * is against the far wall, and the middle of the poster is tile.
   *
   * The fanlight over the door is the one ornament, and it is drawn because it
   * is architecture rather than souvenir — a real thing above a real doorway,
   * in the seven house colours. Everything this destination refuses is a thing
   * this poster does not contain: no car, no cigar, no casino, no flag, no
   * palm. See the long note in src/lib/destinations.ts.
   */
  "havana": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <rect width="300" height="304" fill="var(--ground2)" />

      {/* the fanlight: seven lights, brass at the middle, bone mullions */}
      <g stroke="var(--bone)" strokeWidth="2">
        <path d="M150 141 L70.00 141.00 A80 80 0 0 1 77.92 106.29 Z" fill="var(--oxblood)" />
        <path d="M150 141 L77.92 106.29 A80 80 0 0 1 100.12 78.45 Z" fill="var(--gold)" />
        <path d="M150 141 L100.12 78.45 A80 80 0 0 1 132.20 63.01 Z" fill="var(--aqua)" />
        <path d="M150 141 L132.20 63.01 A80 80 0 0 1 167.80 63.01 Z" fill="var(--gold-lit)" />
        <path d="M150 141 L167.80 63.01 A80 80 0 0 1 199.88 78.45 Z" fill="var(--aqua)" />
        <path d="M150 141 L199.88 78.45 A80 80 0 0 1 222.08 106.29 Z" fill="var(--gold)" />
        <path d="M150 141 L222.08 106.29 A80 80 0 0 1 230.00 141.00 Z" fill="var(--oxblood)" />
      </g>

      {/* the doorframe, the transom under the glass, and the room beyond */}
      <rect x="70" y="141" width="160" height="163" fill="var(--bone)" />
      <rect x="70" y="141" width="160" height="10" fill="var(--night)" />
      <rect x="84" y="151" width="132" height="153" fill="var(--night)" />

      {/* the two leaves, louvred, standing open against the jambs */}
      <g>
        <rect x="84" y="151" width="24" height="153" fill="var(--aqua)" />
        <rect x="192" y="151" width="24" height="153" fill="var(--aqua)" />
        <g stroke="var(--bone)" strokeWidth="1.5" opacity="0.5">
          <path d="M86 162 H106 M86 174 H106 M86 186 H106 M86 198 H106 M86 210 H106 M86 222 H106 M86 234 H106 M86 246 H106 M86 258 H106 M86 270 H106 M86 282 H106 M86 294 H106" />
          <path d="M194 162 H214 M194 174 H214 M194 186 H214 M194 198 H214 M194 210 H214 M194 222 H214 M194 234 H214 M194 246 H214 M194 258 H214 M194 270 H214 M194 282 H214 M194 294 H214" />
        </g>
      </g>

      {/* the bulb in the room the dancing is in */}
      <rect x="148.5" y="151" width="3" height="30" fill="var(--gold)" opacity="0.8" />
      <circle cx="150" cy="188" r="10" fill="var(--gold-lit)" />

      {/* skirting, and the threshold where it crosses the doorway */}
      <rect y="296" width="300" height="8" fill="var(--night)" />

      {/* the floor, and the middle of it left clear */}
      <rect y="304" width="300" height="96" fill="var(--bone)" />
      <g fill="var(--oxblood)" opacity="0.3">
        <path d="M22 315 L33 326 L22 337 L11 326 Z" />
        <path d="M66 315 L77 326 L66 337 L55 326 Z" />
        <path d="M110 315 L121 326 L110 337 L99 326 Z" />
        <path d="M154 315 L165 326 L154 337 L143 326 Z" />
        <path d="M198 315 L209 326 L198 337 L187 326 Z" />
        <path d="M242 315 L253 326 L242 337 L231 326 Z" />
        <path d="M286 315 L297 326 L286 337 L275 326 Z" />
        <path d="M44 359 L55 370 L44 381 L33 370 Z" />
        <path d="M88 359 L99 370 L88 381 L77 370 Z" />
        <path d="M132 359 L143 370 L132 381 L121 370 Z" />
        <path d="M176 359 L187 370 L176 381 L165 370 Z" />
        <path d="M220 359 L231 370 L220 381 L209 370 Z" />
        <path d="M264 359 L275 370 L264 381 L253 370 Z" />
      </g>
      <g stroke="var(--aqua)" strokeWidth="1.25" opacity="0.35">
        <path d="M0 342 H300 M0 388 H300" />
      </g>

      {/* the table, pushed back against the wall, with the coffee on it */}
      <g>
        <path d="M14 228 C4 230 4 244 14 246" fill="none" stroke="var(--night)" strokeWidth="4" />
        <path d="M34 224 L46 222 L46 230 Z" fill="var(--night)" />
        <rect x="14" y="220" width="20" height="34" fill="var(--night)" />
        <rect x="19" y="214" width="10" height="6" fill="var(--gold)" />
        <rect x="41" y="244" width="11" height="10" fill="var(--gold-lit)" />
        <rect x="55" y="244" width="11" height="10" fill="var(--gold-lit)" />
        <rect x="2" y="254" width="66" height="9" fill="var(--oxblood)" />
        <rect x="8" y="263" width="7" height="41" fill="var(--night)" />
        <rect x="55" y="263" width="7" height="41" fill="var(--night)" />
      </g>

      {/* one chair, put back against the other wall, out of the way */}
      <g>
        <rect x="246" y="204" width="6" height="48" fill="var(--night)" />
        <rect x="278" y="204" width="6" height="48" fill="var(--night)" />
        <rect x="242" y="200" width="46" height="7" fill="var(--oxblood)" />
        <rect x="242" y="222" width="46" height="6" fill="var(--oxblood)" />
        <rect x="238" y="252" width="54" height="8" fill="var(--oxblood)" />
        <rect x="244" y="260" width="6" height="44" fill="var(--night)" />
        <rect x="280" y="260" width="6" height="44" fill="var(--night)" />
      </g>
    </>
  ),

  /*
   * The first plate in the library with a TABLE in it, laid and waiting. Every
   * other poster draws the place; this one draws the place and the evening,
   * which is why it can carry a long dinner as well as a getaway.
   */
  "tahiti": (
    <>
      <rect width="300" height="400" fill="var(--bone)" />
      <circle cx="236" cy="86" r="30" fill="var(--gold-lit)" />
      <path
        d="M0 168 C4 150 22 128 44 112 C58 102 66 100 74 108 C94 128 116 148 132 168 Z"
        fill="var(--night)"
      />
      <path
        d="M108 168 C116 154 128 144 142 138 C154 146 164 156 172 168 Z"
        fill="var(--night)"
      />
      <rect y="168" width="300" height="52" fill="var(--aqua)" />
      <g fill="var(--bone)" opacity="0.4">
        <rect y="182" width="300" height="2" />
        <rect y="200" width="300" height="2" />
      </g>
      <rect y="220" width="300" height="180" fill="var(--ground2)" />
      <g fill="var(--bone)" opacity="0.55">
        <path d="M0 226 C34 218 66 222 92 232 C58 228 28 230 0 236 Z" />
        <path d="M196 224 C226 217 258 221 284 231 C252 227 224 229 196 234 Z" />
      </g>
      <g>
        <path d="M150 196 L208 268 L92 268 Z" fill="var(--oxblood)" />
        <g stroke="var(--bone)" strokeWidth="2" opacity="0.4">
          <path d="M138.5 214 L161.5 214" />
          <path d="M124 232 L176 232" />
          <path d="M109.5 250 L190.5 250" />
        </g>
        <rect x="86" y="268" width="128" height="7" fill="var(--gold)" />
        <circle cx="150" cy="192" r="4" fill="var(--gold)" />
      </g>
      <g>
        <rect x="102" y="275" width="6" height="58" fill="var(--gold)" />
        <rect x="192" y="275" width="6" height="58" fill="var(--gold)" />
        <rect x="96" y="296" width="108" height="14" fill="var(--ground2)" />
        <rect x="96" y="310" width="108" height="5" fill="var(--oxblood)" />
        <g stroke="var(--night)" strokeWidth="2" opacity="0.4">
          <path d="M124 296 L124 310 M150 296 L150 310 M176 296 L176 310" />
        </g>
        <g fill="var(--oxblood)">
          <rect x="112" y="278" width="9" height="18" />
          <rect x="126" y="282" width="8" height="14" />
        </g>
        <rect x="180" y="280" width="9" height="16" fill="var(--gold)" />
        <rect x="96" y="333" width="108" height="6" fill="var(--night)" />
      </g>
      <g>
        <rect x="80" y="288" width="4" height="46" fill="var(--night)" />
        <path d="M82 288 C74 279 76 266 82 257 C88 266 90 279 82 288 Z" fill="var(--oxblood)" />
        <path d="M82 281 C78 276 79 269 82 264 C85 269 86 276 82 281 Z" fill="var(--gold-lit)" />
        <rect x="216" y="292" width="4" height="44" fill="var(--night)" />
        <path d="M218 292 C210 283 212 270 218 261 C224 270 226 283 218 292 Z" fill="var(--oxblood)" />
        <path d="M218 285 C214 280 215 273 218 268 C221 273 222 280 218 285 Z" fill="var(--gold-lit)" />
      </g>
      <g>
        <path
          d="M30 348 C 38 306, 50 262, 58 226"
          fill="none"
          stroke="var(--oxblood)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <g transform="translate(58 226) scale(0.78)" fill="var(--night)">
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="rotate(46)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="rotate(94)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1) rotate(46)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1) rotate(94)" />
        </g>
        <circle cx="58" cy="226" r="3.1" fill="var(--oxblood)" />
      </g>
      <g>
        <path
          d="M282 328 C 279 294, 274 262, 270 240"
          fill="none"
          stroke="var(--oxblood)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <g transform="translate(270 240) scale(0.6)" fill="var(--night)">
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="rotate(46)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="rotate(94)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1) rotate(46)" />
          <path d="M0 0 C -16 -12 -40 -15 -62 -5 C -40 6 -17 9 0 5 Z" transform="scale(-1 1) rotate(94)" />
        </g>
        <circle cx="270" cy="240" r="2.4" fill="var(--oxblood)" />
      </g>
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
