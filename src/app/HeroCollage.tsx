/* The hero collage, ported from the design handoff.
   Six vignettes clipped into a 4:5 plate: parasol and sea, a skyline, a
   cocktail, bands of water. Hand-drawn, not stock, and not a gradient
   pretending to be a photograph. Decorative — the plate beside it carries
   the meaning. */
export function HeroCollage() {
  return (
              <svg viewBox="0 0 400 500" aria-hidden="true" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", display: "block" }}>
                <defs>
                  <clipPath id="hA"><rect x="0" y="0" width="230" height="160"></rect></clipPath>
                  <clipPath id="hB"><rect x="230" y="0" width="170" height="160"></rect></clipPath>
                  <clipPath id="hC"><rect x="0" y="160" width="150" height="140"></rect></clipPath>
                  <clipPath id="hD"><rect x="150" y="160" width="250" height="140"></rect></clipPath>
                  <clipPath id="hE"><rect x="0" y="300" width="260" height="80"></rect></clipPath>
                  <clipPath id="hF"><rect x="260" y="300" width="140" height="80"></rect></clipPath>
                </defs>
    
                <g clipPath="url(#hA)">
                  <rect x="0" y="0" width="230" height="160" fill="#E3C9A4"></rect>
                  <circle cx="58" cy="52" r="34" fill="#C9922F"></circle>
                  <rect x="0" y="112" width="230" height="48" fill="#1F6B7A"></rect>
                  <g fill="#FBF4E7" opacity="0.45"><rect x="0" y="126" width="230" height="2"></rect><rect x="0" y="146" width="230" height="2"></rect></g>
                  <path d="M176 160 C168 124 164 92 162 66" stroke="#A83E24" strokeWidth="7" fill="none" strokeLinecap="round"></path>
                  <g transform="translate(162 64)" fill="#16242C">
                    <path d="M0 0 C -14 -10 -34 -13 -52 -4 C -34 5 -15 8 0 4 Z"></path>
                    <path d="M0 0 C -14 -10 -34 -13 -52 -4 C -34 5 -15 8 0 4 Z" transform="rotate(54)" fill="#1F6B7A"></path>
                    <path d="M0 0 C -14 -10 -34 -13 -52 -4 C -34 5 -15 8 0 4 Z" transform="scale(-1 1)"></path>
                    <path d="M0 0 C -14 -10 -34 -13 -52 -4 C -34 5 -15 8 0 4 Z" transform="scale(-1 1) rotate(54)" fill="#1F6B7A"></path>
                  </g>
                </g>
    
                <g clipPath="url(#hB)">
                  <rect x="230" y="0" width="170" height="160" fill="#FBF4E7"></rect>
                  <circle cx="366" cy="34" r="18" fill="#E8A13A"></circle>
                  <g fill="#16242C">
                    <rect x="230" y="74" width="38" height="86"></rect>
                    <rect x="272" y="48" width="44" height="112"></rect>
                    <rect x="320" y="92" width="34" height="68"></rect>
                    <rect x="358" y="66" width="42" height="94"></rect>
                  </g>
                  <path d="M284 26 L306 26 L302 46 L288 46 Z" fill="#A83E24"></path>
                  <rect x="293" y="16" width="4" height="10" fill="#A83E24"></rect>
                  <g fill="#C9922F">
                    <rect x="238" y="90" width="7" height="10"></rect><rect x="252" y="90" width="7" height="10"></rect>
                    <rect x="238" y="114" width="7" height="10"></rect><rect x="280" y="66" width="7" height="10"></rect>
                    <rect x="296" y="66" width="7" height="10"></rect><rect x="280" y="96" width="7" height="10"></rect>
                    <rect x="330" y="110" width="7" height="10"></rect><rect x="366" y="86" width="7" height="10"></rect>
                    <rect x="382" y="112" width="7" height="10"></rect>
                  </g>
                </g>
    
                <g clipPath="url(#hC)">
                  <rect x="0" y="160" width="150" height="140" fill="#FBF4E7"></rect>
                  <path d="M150 214 L150 168 L106 200 L76 182 L34 216 Z" fill="#16242C" opacity="0.85"></path>
                  <g>
                    <rect x="6" y="216" width="30" height="46" fill="#A83E24"></rect>
                    <rect x="40" y="200" width="26" height="62" fill="#E3C9A4"></rect>
                    <rect x="70" y="222" width="32" height="40" fill="#C9922F"></rect>
                    <rect x="106" y="206" width="28" height="56" fill="#FBF4E7" stroke="#16242C" strokeWidth="1.5"></rect>
                  </g>
                  <rect x="0" y="262" width="150" height="38" fill="#1F6B7A"></rect>
                  <g fill="#FBF4E7" opacity="0.4"><rect x="6" y="272" width="30" height="2"></rect><rect x="70" y="284" width="32" height="2"></rect><rect x="106" y="272" width="28" height="2"></rect></g>
                </g>
    
                <g clipPath="url(#hD)">
                  <rect x="150" y="160" width="250" height="140" fill="#16242C"></rect>
                  <rect x="214" y="184" width="120" height="94" fill="#FBF4E7"></rect>
                  <g fill="#A83E24">
                    <rect x="230" y="200" width="88" height="12"></rect>
                    <rect x="230" y="220" width="58" height="12"></rect>
                  </g>
                  <g fill="#1F6B7A">
                    <rect x="230" y="246" width="88" height="8"></rect>
                    <rect x="230" y="262" width="48" height="8"></rect>
                  </g>
                  <g fill="#E8A13A">
                    <circle cx="222" cy="192" r="4"></circle><circle cx="252" cy="192" r="4"></circle><circle cx="282" cy="192" r="4"></circle>
                    <circle cx="312" cy="192" r="4"></circle><circle cx="326" cy="206" r="4"></circle><circle cx="326" cy="236" r="4"></circle>
                    <circle cx="326" cy="266" r="4"></circle><circle cx="222" cy="266" r="4"></circle><circle cx="222" cy="236" r="4"></circle>
                    <circle cx="222" cy="206" r="4"></circle><circle cx="252" cy="272" r="4"></circle><circle cx="282" cy="272" r="4"></circle>
                    <circle cx="312" cy="272" r="4"></circle>
                  </g>
                  <g stroke="#C9922F" strokeWidth="2" opacity="0.75">
                    <path d="M368 196 L368 176 M368 196 L388 186 M368 196 L388 208 M368 196 L350 186"></path>
                  </g>
                  <path d="M176 214 L200 214 L188 240 Z" fill="#A83E24"></path>
                </g>
    
                <g clipPath="url(#hE)">
                  <rect x="0" y="300" width="260" height="80" fill="#E3C9A4"></rect>
                  <g fill="#A83E24">
                    <path d="M28 336 A16 16 0 0 1 60 336 L60 360 L28 360 Z"></path>
                    <path d="M84 336 A16 16 0 0 1 116 336 L116 360 L84 360 Z"></path>
                    <path d="M140 336 A16 16 0 0 1 172 336 L172 360 L140 360 Z"></path>
                    <path d="M196 336 A16 16 0 0 1 228 336 L228 360 L196 360 Z"></path>
                  </g>
                  <g stroke="#FBF4E7" strokeWidth="2" opacity="0.85">
                    <path d="M44 338 L44 358 M100 338 L100 358 M156 338 L156 358 M212 338 L212 358"></path>
                  </g>
                  <rect x="0" y="362" width="260" height="6" fill="#16242C"></rect>
                  <g fill="none" stroke="#1F6B7A" strokeWidth="2.5">
                    <path d="M0 376 A13 13 0 0 1 26 376"></path><path d="M26 376 A13 13 0 0 1 52 376"></path>
                    <path d="M52 376 A13 13 0 0 1 78 376"></path><path d="M78 376 A13 13 0 0 1 104 376"></path>
                    <path d="M104 376 A13 13 0 0 1 130 376"></path><path d="M130 376 A13 13 0 0 1 156 376"></path>
                    <path d="M156 376 A13 13 0 0 1 182 376"></path><path d="M182 376 A13 13 0 0 1 208 376"></path>
                    <path d="M208 376 A13 13 0 0 1 234 376"></path><path d="M234 376 A13 13 0 0 1 260 376"></path>
                  </g>
                  <circle cx="130" cy="314" r="9" fill="#C9922F"></circle>
                </g>
    
                <g clipPath="url(#hF)">
                  <rect x="260" y="300" width="140" height="80" fill="#1F6B7A"></rect>
                  <g fill="#FBF4E7" opacity="0.4"><rect x="260" y="322" width="140" height="2"></rect><rect x="260" y="350" width="140" height="2"></rect><rect x="260" y="370" width="140" height="2"></rect></g>
                  <rect x="300" y="300" width="7" height="52" fill="#16242C"></rect>
                  <rect x="352" y="300" width="7" height="66" fill="#16242C"></rect>
                  <g>
                    <rect x="322" y="316" width="16" height="28" rx="8" fill="#C9922F"></rect>
                    <rect x="322" y="326" width="16" height="5" fill="#A83E24"></rect>
                    <rect x="372" y="342" width="14" height="24" rx="7" fill="#FBF4E7"></rect>
                    <rect x="372" y="350" width="14" height="5" fill="#A83E24"></rect>
                  </g>
                </g>
    
                <g stroke="#FBF4E7" strokeWidth="4">
                  <path d="M0 160 H400 M0 300 H400 M230 0 V160 M150 160 V300 M260 300 V380"></path>
                </g>
    
                <rect y="380" width="400" height="14" fill="#A83E24"></rect>
                <rect y="394" width="400" height="106" fill="#FBF4E7"></rect>
                <g stroke="#DCC7A6" strokeWidth="2"><path d="M74 394 L74 500 M172 394 L172 500 M268 394 L268 500 M350 394 L350 500"></path></g>
                <g>
                  <rect x="104" y="342" width="22" height="38" fill="#1F6B7A"></rect>
                  <rect x="112" y="322" width="7" height="20" fill="#1F6B7A"></rect>
                  <rect x="104" y="360" width="22" height="14" fill="#FBF4E7" opacity="0.85"></rect>
                </g>
                <g fill="#16242C">
                  <path d="M214 352 L240 352 L235 380 L219 380 Z"></path>
                </g>
                <g fill="#A83E24">
                  <path d="M158 356 L182 356 L177 380 L163 380 Z"></path>
                </g>
                <g>
                  <rect x="296" y="330" width="5" height="50" fill="#C9922F"></rect>
                  <path d="M298 330 C293 323 295 316 298 311 C302 316 304 323 298 330 Z" fill="#E8A13A"></path>
                </g>
              </svg>
  );
}
