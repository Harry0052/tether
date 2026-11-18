"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#FAFCFA",
          color: "#14253D",
          fontFamily: "Georgia, serif",
          padding: "4rem 1.25rem",
        }}
      >
        <h1 style={{ fontSize: "2.5rem", fontWeight: 500 }}>Tether hit an unexpected error</h1>
        <p style={{ fontSize: "1.125rem", maxWidth: "36rem", lineHeight: 1.6 }}>
          The screen could not be shown. Nothing new was confirmed. Try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: "1.5rem",
            minHeight: "3rem",
            border: 0,
            borderRadius: "999px",
            background: "#14253D",
            color: "#FAFCFA",
            padding: "0 1.25rem",
            fontSize: "1rem",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
