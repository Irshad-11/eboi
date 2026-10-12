import type { SVGProps } from "react";

/**
 * A small, custom icon set. Square line caps and a 1.75 stroke match the
 * heavy rules and sharp corners of the layout. Icons are always paired with
 * text, so they are aria-hidden by default.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M15 15l5.5 5.5" />
  </Svg>
);

/** A bookmark ribbon: "My List". */
export const IconList = (p: IconProps & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Svg {...rest}>
      <path d="M6 3.5h12v17l-6-4.5-6 4.5z" fill={filled ? "currentColor" : "none"} />
    </Svg>
  );
};

export const IconMenu = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 7h17M3.5 12h17M3.5 17h11" />
  </Svg>
);

export const IconClose = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.5 5.5l13 13M18.5 5.5l-13 13" />
  </Svg>
);

/** Speech balloon with a squared tail. Used for every WhatsApp action. */
export const IconChat = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 4.5h17v11.5h-9l-5 4v-4h-3z" />
    <path d="M8 9.5h8M8 12.5h5" />
  </Svg>
);

export const IconCopy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 8.5h11v12h-11z" />
    <path d="M15.5 8.5v-5h-11v12h4" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Svg>
);

export const IconArrow = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 12h15M13.5 6.5L19 12l-5.5 5.5" />
  </Svg>
);

/** Open book spread: "read the preview". */
export const IconPages = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.5c-2-1.5-5-2-8.5-2v14c3.5 0 6.5.5 8.5 2 2-1.5 5-2 8.5-2v-14c-3.5 0-6.5.5-8.5 2z" />
    <path d="M12 6.5v14" />
  </Svg>
);

export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4.5v15M4.5 12h15" />
  </Svg>
);

export const IconMinus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 12h15" />
  </Svg>
);

export const IconUpload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 15.5V4M7 8.5l5-5 5 5M4.5 15v5.5h15V15" />
  </Svg>
);

export const IconDownload = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.5V15M7 10l5 5 5-5M4.5 15v5.5h15V15" />
  </Svg>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 6.5h16M9.5 6.5V3.5h5v3M6.5 6.5l1 14h9l1-14" />
  </Svg>
);

export const IconFilter = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 6h17M6.5 12h11M10 18h4" />
  </Svg>
);

export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13.5 4.5h6v6M19.5 4.5l-9 9M17 13.5v6H4.5V7h6" />
  </Svg>
);

export const IconGrip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3} />
  </Svg>
);
