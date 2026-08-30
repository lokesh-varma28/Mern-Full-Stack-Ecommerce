/**
 * SceneBackground – shared scenic SVG used by Login, Register, VerifyOtp.
 * Extracted to avoid 200+ lines of SVG duplicated in every auth page.
 */
export default function SceneBackground() {
    return (
        <div className="login-scene">
            <svg
                viewBox="0 0 1600 900"
                preserveAspectRatio="xMidYMax slice"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#e6eef2" />
                        <stop offset="45%"  stopColor="#c7d9e2" />
                        <stop offset="100%" stopColor="#9fb7c9" />
                    </linearGradient>
                </defs>

                {/* Sky */}
                <rect x="0" y="0" width="1600" height="900" fill="url(#sc-sky)" />

                {/* Distant mountains */}
                <path
                    d="M0,560 L60,500 130,545 210,470 300,530 380,455 470,520 560,460
                       650,540 740,470 830,545 920,480 1010,530 1100,460 1190,540
                       1280,475 1370,540 1460,485 1600,540 1600,900 0,900 Z"
                    fill="#93aec2" opacity="0.75"
                />

                {/* Cloud cluster */}
                <g fill="#5f7a90">
                    <ellipse cx="820" cy="330" rx="95"  ry="75" />
                    <ellipse cx="900" cy="290" rx="120" ry="95" />
                    <ellipse cx="1000" cy="330" rx="105" ry="82" />
                    <ellipse cx="880" cy="380" rx="140" ry="90" />
                    <ellipse cx="1010" cy="390" rx="100" ry="75" />
                    <ellipse cx="750" cy="380" rx="90"  ry="70" />
                </g>
                <rect x="885" y="420" width="30" height="160" fill="#4a5f74" />

                {/* Mid hills */}
                <path
                    d="M0,660 L70,610 150,650 230,595 320,645 410,590 500,640
                       590,600 680,650 770,605 860,655 950,600 1040,650
                       1130,610 1220,655 1310,600 1400,650 1490,605 1600,650
                       1600,900 0,900 Z"
                    fill="#42566a"
                />

                {/* Pine trees – left */}
                <g fill="#39495b">
                    <g transform="translate(220,560)">
                        <rect x="-4" y="0" width="8" height="55" />
                        <ellipse cx="0" cy="-8" rx="55" ry="14" />
                    </g>
                    <g transform="translate(1330,545)">
                        <rect x="-4" y="0" width="8" height="60" />
                        <ellipse cx="0" cy="-8" rx="60" ry="15" />
                    </g>
                    <g transform="translate(1420,590)">
                        <rect x="-3" y="0" width="6" height="40" />
                        <ellipse cx="0" cy="-6" rx="42" ry="11" />
                    </g>
                </g>

                {/* Dark foreground hills */}
                <path
                    d="M0,760 L90,715 190,750 280,700 380,745 480,695 590,740
                       690,700 800,745 900,700 1010,745 1110,700 1220,745
                       1330,700 1440,745 1540,705 1600,730 1600,900 0,900 Z"
                    fill="#1f2c3a"
                />

                {/* Big tree silhouette */}
                <g fill="#131c26">
                    <g transform="translate(120,745)">
                        <ellipse cx="0"  cy="-20" rx="150" ry="16" />
                        <ellipse cx="-40" cy="-30" rx="70"  ry="20" />
                        <ellipse cx="60"  cy="-32" rx="80"  ry="22" />
                        <rect x="-6" y="-10" width="12" height="70" />
                    </g>
                </g>

                {/* Deer silhouettes */}
                <g fill="#0f1720" opacity="0.95">
                    <g transform="translate(390,800) scale(1.15)">
                        <ellipse cx="0" cy="0" rx="46" ry="20" />
                        <path d="M-30,-8 Q-46,-40 -36,-52" stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M-30,10 L-40,45"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M-10,14 L-14,48"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M14,14 L18,48"    stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M32,10 L42,45"    stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M-36,-50 L-44,-64" stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <path d="M-36,-50 L-30,-66" stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                    </g>
                    <g transform="translate(1230,815) scale(1.3) rotate(-4)">
                        <ellipse cx="0" cy="0" rx="46" ry="20" />
                        <path d="M28,-8 Q46,-38 38,-52"  stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M-32,10 L-42,45"        stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M-10,14 L-14,48"        stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M12,14 L16,48"          stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M34,10 L44,45"          stroke="#0f1720" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M38,-50 L30,-64"        stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <path d="M38,-50 L46,-66"        stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" />
                    </g>
                </g>

                {/* Grass tufts */}
                <g stroke="#0f1720" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.85">
                    <path d="M40,880 Q50,850 45,880" />
                    <path d="M70,885 Q80,855 78,885" />
                    <path d="M1520,880 Q1530,850 1526,880" />
                    <path d="M1560,885 Q1570,855 1566,885" />
                    <path d="M600,890 Q610,865 606,890" />
                    <path d="M980,890 Q990,865 986,890" />
                </g>
            </svg>
        </div>
    );
}
