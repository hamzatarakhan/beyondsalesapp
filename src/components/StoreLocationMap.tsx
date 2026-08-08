import { useEffect, useRef } from "react";
import { Drawer, DrawerContent, DrawerClose, DrawerTitle } from "@/components/ui/drawer";
import { MapPin, X } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon paths broken by Vite bundling (mirrors MapPicker.tsx)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface StoreLocationMapProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storeName: string;
  storeLocation: string;
  /** [lat, lng] — defaults to Riyadh (matches MapPicker.tsx's RIYADH constant). */
  coords?: [number, number];
}

const DEFAULT_COORDS: [number, number] = [24.7136, 46.6753];

// Read-only "here's the store" map (as opposed to MapPicker.tsx, which lets the dealer
// tap to choose a delivery location) — just centers on a fixed pin, no interaction needed.
const StoreLocationMap = ({ open, onOpenChange, storeName, storeLocation, coords = DEFAULT_COORDS }: StoreLocationMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!open) return;
    // small delay so the drawer finishes animating before map init
    const t = setTimeout(() => {
      if (!mapRef.current || leafletMap.current) return;
      const map = L.map(mapRef.current, { zoomControl: true }).setView(coords, 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);
      L.marker(coords).addTo(map);
      leafletMap.current = map;
    }, 300);

    return () => clearTimeout(t);
  }, [open, coords]);

  useEffect(() => {
    if (!open && leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
    }
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh] flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-300" />
            </span>
            <div className="min-w-0">
              <DrawerTitle className="font-semibold text-sm text-foreground truncate">{storeName}</DrawerTitle>
              <p className="text-xs text-muted-foreground truncate">{storeLocation}</p>
            </div>
          </div>
          <DrawerClose className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-muted-foreground" />
          </DrawerClose>
        </div>

        <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />
      </DrawerContent>
    </Drawer>
  );
};

export default StoreLocationMap;
