import { WebsiteCopy } from "@/components/website-copy";
import Link from "next/link";
export default function Missing() {
  return (
    <section className="page">
      <h1><WebsiteCopy id="design_copy_63db00b3e4a8" fallback={"Page not found."} /></h1>
      <Link className="button" href="/"><WebsiteCopy id="design_copy_804ff20ae9a9" fallback={"Return home"} /></Link>
    </section>
  );
}
