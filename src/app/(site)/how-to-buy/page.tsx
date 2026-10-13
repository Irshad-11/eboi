import { permanentRedirect } from "next/navigation";

/** The page was renamed; old links keep working. */
export default function HowToBuyPage() {
  permanentRedirect("/how-to-order");
}
