interface Props {
  origin: string;
  destination: string;
}

export default function BoatRouteMap({ origin, destination }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  const src = `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=transit`;

  return (
    <div className="rounded-2xl overflow-hidden border border-blue-400/30 shadow-lg shadow-blue-900/20">
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-950/60 backdrop-blur-sm border-b border-blue-400/20">
        <span className="text-blue-300 text-sm">⛵</span>
        <span className="text-xs font-semibold text-blue-200 tracking-wide uppercase">Thames River Route</span>
      </div>
      <iframe
        src={src}
        width="100%"
        height="280"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="River boat route map"
      />
    </div>
  );
}
