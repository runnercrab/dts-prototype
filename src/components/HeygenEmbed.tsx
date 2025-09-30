// dts-prototype/src/components/HeygenEmbed.tsx
"use client";

export default function HeygenEmbed() {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9" }}>
      <iframe
        src="https://app.heygen.com/embedded-player/f1caed13b95f4809b5edfa55529ce7d8"
        title="HeyGen video player"
        allow="encrypted-media; fullscreen;"
        allowFullScreen
        frameBorder={0}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
    </div>
  );
}
