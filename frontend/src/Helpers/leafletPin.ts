import L from "leaflet";

// Default Leaflet marker icons resolve to broken image URLs under Vite, so use a
// self-contained SVG pin instead of the bundled PNG assets.
export const createPinIcon = () =>
  L.divIcon({
    className: "",
    html: `
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.716 0 0 6.716 0 15c0 10.5 15 27 15 27s15-16.5 15-27c0-8.284-6.716-15-15-15z" fill="#2B9AE9" stroke="#FFFFFF" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="5.5" fill="#FFFFFF"/>
    </svg>
  `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -38],
  });
