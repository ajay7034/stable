"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="page">
      <h1>We’ll be right back.</h1>
      <p>Our content service is temporarily unavailable. Please try again.</p>
      <button onClick={reset}>Try again</button>
    </section>
  );
}
