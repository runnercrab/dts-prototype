// dts-prototype/src/app/heygen-demo/page.tsx
export const dynamic = "force-static";

export default function HeygenDemoPage() {
  return (
    <main className="container-page" style={{ padding: "24px" }}>
      <h1 className="mb-4">Demo Avatar HeyGen</h1>
      <p className="mb-6">Vídeo incrustado con iframe (no afecta al asistente).</p>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          aspectRatio: "16 / 9",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          background: "#000",
        }}
      >
        <iframe
          src="https://app.heygen.com/embedded-player/f1caed13b95f4809b5edfa55529ce7d8"
          title="HeyGen video player"
          allow="encrypted-media; fullscreen;"
          allowFullScreen
          frameBorder={0}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </main>
  );
}
