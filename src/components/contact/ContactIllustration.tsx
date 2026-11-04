// Original flat illustration for the contact page: a customer service agent,
// a customer, and a phone with a call screen. Pure SVG, so it stays sharp at
// any size and adds no network request. The palette matches the contact page
// (purple, coral, pink); change the hex values here to re-theme it.
export function ContactIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 440"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A charter team member on a headset and a customer reaching out by phone, with a 24 hour badge"
      className={className}
    >
      <defs>
      <path id="ct-handset" d="M-8 -9 q0 -4 4 -4 l4 5 q1 2 -1 3.5 q2.5 5 6.5 7 q2 -2 3.5 -1 l5 4 q0 4 -4 4 q-18 0 -18 -18.5 z"/>
      </defs>
      <path d="M330 96 C410 64 520 96 542 190 C556 252 536 300 520 346 C500 404 420 430 330 424 C240 418 168 392 156 316 C146 252 196 214 244 176 C276 150 296 112 330 96 Z" fill="#E4EAFB"/>
      <path d="M168 72 C262 -4 440 6 518 142" fill="none" stroke="#C7D1F0" strokeWidth="2.5" strokeDasharray="6 7" strokeLinecap="round"/>
      <g transform="translate(128 52)"><path d="M0 20 L42 0 L24 40 L17 24 Z" fill="#8E7CE8"/><path d="M17 24 L42 0 L6 15 Z" fill="#6F5BD6"/></g>
      <ellipse cx="135" cy="399" rx="58" ry="7" fill="#C9D3EE"/>
      <ellipse cx="488" cy="396" rx="64" ry="7" fill="#C9D3EE"/>

      <rect x="190" y="58" width="190" height="338" rx="24" fill="#5B3FC9"/>
      <rect x="201" y="84" width="168" height="282" rx="10" fill="#DCE5FA"/>
      <circle cx="268" cy="71" r="3" fill="#3F2B96"/><rect x="281" y="69" width="34" height="5" rx="2.5" fill="#3F2B96"/><circle cx="324" cy="71.5" r="2.5" fill="#3F2B96"/>
      <circle cx="285" cy="381" r="8" fill="none" stroke="#3F2B96" strokeWidth="3"/>
      <rect x="335" y="98" width="24" height="17" rx="2.5" fill="#F9605F"/><path d="M335.5 100 L347 109 L358.5 100" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="285" cy="170" r="30" fill="#5B3FC9"/><circle cx="285" cy="162" r="10" fill="#DCE5FA"/><path d="M267 191 Q285 168 303 191 Q285 199 267 191 Z" fill="#DCE5FA"/>
      <rect x="246" y="214" width="78" height="9" rx="4.5" fill="#A9B8F0"/>
      <circle cx="233" cy="322" r="14" fill="#F9605F"/><path d="M225.5 324.5 q7.5 -6 15 0" stroke="#fff" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
      <circle cx="285" cy="322" r="14" fill="#fff"/><use href="#ct-handset" transform="translate(285 322) scale(.78)" fill="#5B3FC9"/>
      <rect x="326" y="308" width="28" height="28" rx="8" fill="#F7C0E3"/><rect x="333" y="318" width="12" height="9" rx="2" fill="#5B3FC9"/><path d="M345 320.5 L351 317.5 L351 327.5 L345 324.5 Z" fill="#5B3FC9"/>

      <g transform="translate(168 118)"><rect width="44" height="38" rx="10" fill="#8E7CE8"/><path d="M10 38 L5 52 L24 38 Z" fill="#8E7CE8"/><use href="#ct-handset" transform="translate(22 19) scale(.95)" fill="#fff"/></g>
      <g><circle cx="140" cy="108" r="19" fill="#fff" stroke="#8E7CE8" strokeWidth="2.5"/><text x="140" y="113.5" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="15" fontWeight="700" fill="#5B3FC9">24</text></g>

      <path d="M110 250 L129 250 L121 392 L103 392 Z" fill="#4C74D0"/><path d="M129 250 L149 250 L156 392 L138 392 Z" fill="#3E63B8"/>
      <path d="M99 392 h24 l3 8 h-29 z" fill="#2B2350"/><path d="M135 392 h24 l3 8 h-29 z" fill="#2B2350"/>
      <path d="M104 184 Q128 171 152 184 L150 260 L108 260 Z" fill="#8E3A97"/>
      <path d="M108 190 L101 238" stroke="#8E3A97" strokeWidth="13" strokeLinecap="round"/><circle cx="100" cy="245" r="6.5" fill="#F2B48C"/>
      <path d="M148 190 L178 170" stroke="#8E3A97" strokeWidth="13" strokeLinecap="round"/><circle cx="183" cy="166" r="6.5" fill="#F2B48C"/>
      <rect x="123" y="169" width="10" height="14" fill="#F2B48C"/><circle cx="128" cy="155" r="15" fill="#F2B48C"/>
      <path d="M113 155 Q112 136 128 136 Q144 136 143 155 Q138 146 128 146 Q118 146 113 155 Z" fill="#2B2350"/>
      <path d="M114 152 Q114 133 128 133 Q142 133 142 152" fill="none" stroke="#2B2350" strokeWidth="3"/><rect x="110" y="150" width="6" height="12" rx="3" fill="#5B3FC9"/><path d="M113 162 Q116 171 125 171" stroke="#5B3FC9" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      <path d="M494 352 L454 354 L452 388" fill="none" stroke="#5B3FC9" strokeWidth="21" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M498 354 L536 382" fill="none" stroke="#4A33A8" strokeWidth="19" strokeLinecap="round"/>
      <ellipse cx="446" cy="394" rx="13" ry="5" fill="#2B2350"/><ellipse cx="544" cy="390" rx="11" ry="5" fill="#2B2350"/>
      <path d="M472 294 Q494 281 515 295 L511 354 L474 354 Z" fill="#E5483F"/>
      <path d="M478 302 L452 292" stroke="#E5483F" strokeWidth="12" strokeLinecap="round"/><circle cx="447" cy="290" r="6" fill="#F2B48C"/>
      <path d="M486 310 L454 308" stroke="#E5483F" strokeWidth="12" strokeLinecap="round"/><circle cx="449" cy="308" r="6" fill="#F2B48C"/>
      <rect x="488" y="270" width="9" height="13" fill="#F2B48C"/><circle cx="493" cy="267" r="14" fill="#F2B48C"/>
      <path d="M479 267 Q478 249 494 249 Q510 250 507 269 Q502 259 493 259 Q484 259 479 267 Z" fill="#3A2A2A"/><circle cx="503" cy="247" r="8" fill="#3A2A2A"/>

      <g transform="translate(414 262) rotate(-14)"><rect x="-31" y="-35" width="62" height="70" rx="6" fill="#F9605F"/><rect x="-31" y="-35" width="13" height="70" rx="6" fill="#E5483F"/>
      <circle cx="-24.5" cy="-23" r="3.2" fill="#FCD0CB"/><circle cx="-24.5" cy="-9" r="3.2" fill="#FCD0CB"/><circle cx="-24.5" cy="5" r="3.2" fill="#FCD0CB"/><circle cx="-24.5" cy="19" r="3.2" fill="#FCD0CB"/>
      <rect x="28" y="-22" width="7" height="11" rx="2" fill="#F7A39A"/><rect x="28" y="-6" width="7" height="11" rx="2" fill="#F7A39A"/>
      <use href="#ct-handset" transform="translate(4 0) scale(1.7)" fill="#fff"/></g>

      <g transform="translate(-8 -16)"><path d="M522 266 q0 -24 17 -24 q17 0 17 24 l7 9 h-48 z" fill="#D865B8"/><circle cx="539" cy="239" r="3.5" fill="#D865B8"/><circle cx="539" cy="281" r="5" fill="#B24A9A"/><circle cx="558" cy="250" r="7" fill="#F9605F"/><path d="M554.5 250.5 L557 253 L561.5 247.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/></g>
    </svg>
  );
}