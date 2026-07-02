import { useEffect, useRef, useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { MapPin, Navigation, Check } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapPickerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (city: string, address: string) => void;
}

interface NominatimResult {
  display_name: string;
  address: {
    city?: string;
    town?: string;
    county?: string;
    state?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    house_number?: string;
    postcode?: string;
  };
}

const RIYADH: [number, number] = [24.7136, 46.6753];

const MapPicker = ({ open, onOpenChange, onConfirm }: MapPickerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [latlng, setLatlng] = useState<[number, number] | null>(null);
  const [resolvedCity, setResolvedCity] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    // small delay so drawer finishes animating before map init
    const t = setTimeout(() => {
      if (!mapRef.current || leafletMap.current) return;
      const map = L.map(mapRef.current, { zoomControl: true }).setView(RIYADH, 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setLatlng([lat, lng]);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
        reverseGeocode(lat, lng);
      });

      leafletMap.current = map;
    }, 300);

    return () => {
      clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open && leafletMap.current) {
      leafletMap.current.remove();
      leafletMap.current = null;
      markerRef.current = null;
      setLatlng(null);
      setResolvedCity("");
      setResolvedAddress("");
    }
  }, [open]);

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data: NominatimResult = await res.json();
      const addr = data.address;
      const city = addr.city || addr.town || addr.county || addr.state || "";
      const street = [addr.house_number, addr.road, addr.suburb || addr.neighbourhood]
        .filter(Boolean)
        .join(", ");
      const full = [street, city, addr.postcode].filter(Boolean).join(", ");
      setResolvedCity(city);
      setResolvedAddress(full || data.display_name);
    } catch {
      setResolvedCity("");
      setResolvedAddress("");
    } finally {
      setLoading(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation || !leafletMap.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatlng([lat, lng]);
      leafletMap.current!.setView([lat, lng], 15);
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(leafletMap.current!);
      }
      reverseGeocode(lat, lng);
    });
  };

  const handleConfirm = () => {
    if (!latlng) return;
    onConfirm(resolvedCity, resolvedAddress);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Pin Delivery Location</span>
          </div>
          <button
            onClick={handleCurrentLocation}
            className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <Navigation className="w-3 h-3" />
            My Location
          </button>
        </div>

        {/* Map */}
        <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: 0 }} />

        {/* Footer */}
        <div className="shrink-0 border-t border-border/60 px-4 py-3 space-y-3 bg-background">
          {latlng ? (
            <div className="space-y-1">
              {loading ? (
                <p className="text-xs text-muted-foreground">Fetching address…</p>
              ) : (
                <>
                  {resolvedCity && (
                    <p className="text-xs text-muted-foreground">
                      City: <span className="font-medium text-foreground">{resolvedCity}</span>
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    Address: <span className="font-medium text-foreground">{resolvedAddress}</span>
                  </p>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">Tap on the map to pin your delivery location</p>
          )}
          <button
            onClick={handleConfirm}
            disabled={!latlng || loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)" }}
          >
            <Check className="w-4 h-4" />
            Confirm Location
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MapPicker;
