import HeygenEmbed from "@/components/HeygenEmbed";

export default function HeygenDemoPage() {
  return (
    <main className="container-page">
      <h1 className="mb-4">Demo del Avatar HeyGen</h1>
      <p className="mb-6">Aquí se incrusta el vídeo de prueba desde HeyGen.</p>
      <HeygenEmbed />
    </main>
  );
}
