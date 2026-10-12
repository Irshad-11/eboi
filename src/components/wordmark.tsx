/**
 * eBoi wordmark: an italic "e" (electronic) set against an upright "Boi"
 * (Bangla for book), a square full stop for the i, and a heavy press rule.
 * Drawn from Newsreader Display outlines, then edited, so it renders
 * identically everywhere without loading a font. Paths are split so the
 * splash screen can animate each piece.
 */

export const WORDMARK_VIEWBOX = "0 -1440 4192 1680";

export const WORDMARK_PATHS = {
  letters: [
    "M639 -996Q585 -996 534 -956Q484 -916 441 -848Q398 -781 366 -696Q333 -612 315 -521Q297 -430 297 -344Q297 -241 335 -195Q373 -149 452 -149Q510 -149 568 -171Q626 -193 686 -250Q745 -308 805 -414L818 -413Q749 -237 672 -142Q596 -47 514 -12Q432 24 344 24Q240 24 170 -14Q100 -53 66 -123Q31 -193 31 -287Q31 -386 60 -492Q88 -599 143 -698Q198 -797 276 -876Q355 -955 456 -1002Q556 -1048 676 -1048Q772 -1048 827 -1022Q882 -997 906 -955Q929 -913 929 -865Q929 -816 914 -767Q898 -718 867 -674Q822 -654 751 -628Q680 -603 594 -576Q509 -550 418 -524Q326 -499 239 -477L245 -513Q359 -552 440 -588Q521 -625 574 -662Q628 -698 658 -735Q688 -772 700 -812Q713 -851 713 -894Q713 -928 704 -950Q695 -973 679 -984Q663 -996 639 -996Z",
    "M1221 -1347 1343 -1430H1756Q1922 -1430 2025 -1388Q2128 -1346 2176 -1272Q2223 -1199 2223 -1104Q2223 -957 2111 -870Q1999 -784 1825 -767L1851 -783Q2074 -767 2197 -666Q2320 -565 2320 -395Q2320 -280 2259 -190Q2198 -101 2066 -50Q1933 0 1718 0H1344L1238 -83H1620Q1726 -83 1802 -118Q1878 -152 1918 -224Q1959 -296 1959 -409Q1959 -501 1926 -572Q1893 -642 1824 -682Q1756 -723 1647 -723H1237L1221 -806H1651Q1751 -806 1811 -874Q1871 -943 1871 -1080Q1871 -1161 1840 -1221Q1810 -1281 1744 -1314Q1679 -1347 1573 -1347ZM948 0V-35L1110 -86V-1345L948 -1394V-1430H1511V0Z",
    "M2960 -40Q3023 -40 3062 -86Q3100 -132 3117 -230Q3134 -329 3134 -485Q3134 -651 3118 -762Q3101 -872 3062 -928Q3024 -983 2958 -983Q2894 -983 2856 -937Q2818 -891 2801 -793Q2784 -695 2784 -539Q2784 -374 2800 -263Q2816 -152 2854 -96Q2893 -40 2960 -40ZM2947 26Q2792 26 2673 -42Q2554 -110 2488 -230Q2421 -351 2421 -508Q2421 -669 2492 -791Q2564 -913 2688 -982Q2813 -1050 2970 -1050Q3129 -1050 3247 -982Q3365 -915 3431 -794Q3497 -674 3497 -516Q3497 -355 3424 -232Q3351 -110 3227 -42Q3103 26 2947 26Z",
    "M4055 -1054V-844V-62L4154 -31V0H3601V-31L3707 -64V-780Q3695 -792 3678 -809Q3661 -826 3638 -850Q3615 -873 3584 -905V-933L4036 -1054Z"
],
  dot: "M3751 -1430h260v260h-260z",
  rule: "M31 120H4154v110H31z",
} as const;

type Props = {
  className?: string;
  title?: string;
  /** Splash mode adds per-piece classes for the CSS animation. */
  animated?: boolean;
};

export function Wordmark({ className, title = "eBoi", animated = false }: Props) {
  return (
    <svg
      viewBox={WORDMARK_VIEWBOX}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        {WORDMARK_PATHS.letters.map((d, i) => (
          <path key={i} d={d} className={animated ? "wm-letter" : undefined} />
        ))}
      </g>
      <path d={WORDMARK_PATHS.dot} className={animated ? "wm-dot" : undefined} />
      <path d={WORDMARK_PATHS.rule} className={animated ? "wm-rule" : undefined} />
    </svg>
  );
}
