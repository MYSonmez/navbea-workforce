// Fictional block locations for the demo. These are not surveyed site coordinates.
export function demoBlocks(siteId: string) {
  const center =
    siteId === "sahil" ? { lat: 40.9845, lng: 29.028 } : { lat: 40.9913, lng: 29.1235 };
  return {
    center,
    blocks: [
      { id: "a", name: "A Blok", lat: center.lat + 0.0007, lng: center.lng - 0.0007 },
      { id: "b", name: "B Blok", lat: center.lat + 0.0003, lng: center.lng + 0.0008 },
      { id: "c", name: "C Blok", lat: center.lat - 0.0007, lng: center.lng - 0.0001 },
    ],
  };
}
