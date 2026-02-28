interface Props {
  origin: string;
  destination: string;
}

export default function CycleRouteMap({ origin, destination }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=bicycling`;

  return (
    <div className="rounded-2xl overflow-hidden border border-green-500/30 shadow-lg shadow-green-900/20">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-950/60 backdrop-blur-sm border-b border-green-500/20">
        <span className="text-green-400 text-sm">🚲</span>
        <span className="text-xs font-semibold text-green-300 tracking-wide uppercase">Cycling Route</span>
      </div>
      <iframe
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Cycling route map"
      />
    </div>
  );
}
