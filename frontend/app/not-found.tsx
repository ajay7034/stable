import Link from "next/link";
export default function Missing() {
  return (
    <section className="page">
      <h1>Page not found.</h1>
      <Link className="button" href="/">
        Return home
      </Link>
    </section>
  );
}
