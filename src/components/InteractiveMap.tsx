import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import {
  APIProvider,
  Map as GoogleMapComponent,
  AdvancedMarker,
  Pin,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Train, ExternalLink, Compass, Layers, Info, Sparkles, Map as MapIcon, Globe } from 'lucide-react';
import { TRAStation, ItineraryStop } from '../types';
import { TAIWAN_TRA_STATIONS } from '../data/taiwanStations';
import L from 'leaflet';

// Leaflet default icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface InteractiveMapProps {
  originStation: TRAStation;
  destinationStation: TRAStation;
  stops?: ItineraryStop[];
  userLocation?: { lat: number; lng: number } | null;
  onSelectStation?: (station: TRAStation) => void;
  selectedStop?: ItineraryStop | null;
  className?: string;
  googleMapsApiKey?: string;
  onOpenApiKeyModal?: () => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  originStation,
  destinationStation,
  stops = [],
  userLocation,
  onSelectStation,
  selectedStop,
  className = '',
  googleMapsApiKey = '',
  onOpenApiKeyModal,
}) => {
  const apiKey =
    googleMapsApiKey ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    '';
  const hasValidGoogleKey = Boolean(apiKey) && apiKey !== 'YOUR_API_KEY' && apiKey.length > 10;

  // Default to OpenStreetMap (zero-configuration interactive map)
  const [mapMode, setMapMode] = useState<'osm' | 'google'>('osm');
  const [showStationsLayer, setShowStationsLayer] = useState(true);
  const [showKeyInstructions, setShowKeyInstructions] = useState(false);

  // Leaflet Map Ref
  const leafletContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const leafletMarkersRef = useRef<L.LayerGroup | null>(null);

  // Center position calculation
  const centerLat = destinationStation ? destinationStation.lat : 24.8276;
  const centerLng = destinationStation ? destinationStation.lng : 121.7725;

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (mapMode === 'google' && hasValidGoogleKey) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    if (!leafletContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(leafletContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      leafletMarkersRef.current = markersGroup;
      leafletMapRef.current = map;

      // Force layout invalidation after mounting to fix zero-height issues during CSS transitions
      setTimeout(() => {
        map.invalidateSize();
      }, 150);
      setTimeout(() => {
        map.invalidateSize();
      }, 400);
    }

    const map = leafletMapRef.current;
    const markersGroup = leafletMarkersRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    const latlngs: L.LatLngExpression[] = [];

    // 1. Destination Station Marker
    const destIcon = L.divIcon({
      className: 'custom-station-icon',
      html: `<div style="background:#13695F; color:#F8F5D6; font-weight:bold; font-size:11px; padding:5px 10px; border-radius:20px; border:2px solid #81D8CF; box-shadow:0 3px 8px rgba(15,58,53,0.4); display:flex; align-items:center; gap:5px; white-space:nowrap; cursor:pointer;">
              <span>🚉 ${destinationStation.name}火車站</span>
             </div>`,
      iconSize: [100, 30],
      iconAnchor: [50, 15],
    });

    const destMarker = L.marker([destinationStation.lat, destinationStation.lng], { icon: destIcon }).addTo(markersGroup);
    destMarker.bindPopup(`
      <div style="font-family:sans-serif; min-width:200px; padding:4px;">
        <h4 style="margin:0 0 4px; color:#0F3A35; font-size:14px; font-weight:bold;">🚉 ${destinationStation.name}火車站</h4>
        <p style="margin:0 0 6px; font-size:12px; color:#13695F;">${destinationStation.county} • ${destinationStation.line}</p>
        <p style="margin:0 0 8px; font-size:11px; color:#546E6A; line-height:1.4;">${destinationStation.description || '台鐵主要旅遊出發/目的地站點'}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${destinationStation.lat},${destinationStation.lng}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:4px; padding:5px 10px; background:#1A8F82; color:white; border-radius:6px; font-size:11px; text-decoration:none; font-weight:bold;">
          啟動 Google Maps 導航 ➔
        </a>
      </div>
    `);
    latlngs.push([destinationStation.lat, destinationStation.lng]);

    // 2. Itinerary Stops Markers & Connecting Line
    if (stops && stops.length > 0) {
      const stopPoints: [number, number][] = [[destinationStation.lat, destinationStation.lng]];

      stops.forEach((stop, idx) => {
        const stopLat = stop.lat;
        const stopLng = stop.lng;
        stopPoints.push([stopLat, stopLng]);
        latlngs.push([stopLat, stopLng]);

        const color = stop.category === 'food' ? '#8C7C20' : stop.category === 'photo' ? '#13695F' : '#1A8F82';
        const categoryEmoji = stop.category === 'food' ? '🍜' : stop.category === 'photo' ? '📸' : '📍';

        const stopIcon = L.divIcon({
          className: 'custom-stop-icon',
          html: `<div style="background:${color}; color:#FAF8E7; font-weight:900; font-size:12px; width:30px; height:30px; border-radius:50%; border:2px solid #F8F5D6; box-shadow:0 3px 8px rgba(15,58,53,0.35); display:flex; align-items:center; justify-content:center; cursor:pointer;">
                  ${idx + 1}
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([stopLat, stopLng], { icon: stopIcon }).addTo(markersGroup);
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:210px; max-width:280px; padding:4px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <span style="background:#FAF8E7; color:${color}; border:1px solid #E5DEAA; font-size:10px; font-weight:bold; padding:2px 6px; border-radius:4px;">
                ${categoryEmoji} ${stop.category === 'food' ? '必吃美食' : '人氣景點'} • 停留 ${stop.durationMinutes} 分鐘
              </span>
              <span style="font-size:10px; color:#546E6A;">${stop.timeSlot}</span>
            </div>
            <h4 style="margin:4px 0 2px; font-size:13px; font-weight:bold; color:#122B28;">${idx + 1}. ${stop.placeName}</h4>
            <p style="margin:0 0 4px; font-size:11px; color:#13695F; font-weight:600;">✨ ${stop.highlight}</p>
            <p style="margin:0 0 6px; font-size:11px; color:#546E6A; line-height:1.4;">${stop.description}</p>
            <div style="border-top:1px solid #E5DEAA; padding-top:6px; margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:10px; color:#78928E; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${stop.address || ''}</span>
              <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.placeName + ' ' + stop.address)}&travelmode=walking" target="_blank" rel="noopener noreferrer" style="padding:4px 8px; background:#1A8F82; color:white; border-radius:6px; font-size:11px; text-decoration:none; font-weight:bold; white-space:nowrap;">
                Google 導航 ➔
              </a>
            </div>
          </div>
        `);
      });

      // Draw polyline between stops
      L.polyline(stopPoints, {
        color: '#1A8F82',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
      }).addTo(markersGroup);
    }

    // 3. User location if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-icon',
        html: `<div style="background:#10b981; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 0 10px rgba(16,185,129,0.8);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(markersGroup)
        .bindPopup('📍 您目前的 GPS 定位位置');
      latlngs.push([userLocation.lat, userLocation.lng]);
    }

    // 4. Other Stations on map if layer enabled
    if (showStationsLayer) {
      TAIWAN_TRA_STATIONS.forEach((st) => {
        if (st.id === destinationStation.id) return;
        const otherIcon = L.divIcon({
          className: 'other-station-icon',
          html: `<div style="background:#64748b; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 1px 3px rgba(0,0,0,0.3);" title="${st.name}站"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        });
        const marker = L.marker([st.lat, st.lng], { icon: otherIcon }).addTo(markersGroup);
        marker.bindPopup(`
          <div style="font-family:sans-serif; min-width:160px; padding:2px;">
            <strong style="font-size:12px; color:#1e293b;">🚉 ${st.name}火車站</strong>
            <p style="margin:2px 0 4px; font-size:11px; color:#64748b;">${st.county} • ${st.line}</p>
            <p style="margin:0; font-size:10px; color:#d97706;">🍜 必吃: ${st.popularFoods.slice(0, 2).join('、')}</p>
          </div>
        `);
      });
    }

    // Fit map bounds
    if (latlngs.length > 1) {
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([centerLat, centerLng], 14);
    }
  }, [destinationStation, stops, userLocation, showStationsLayer, mapMode, hasValidGoogleKey]);

  // ResizeObserver to ensure tiles render immediately when parent resizes
  useEffect(() => {
    if (!leafletContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      if (leafletMapRef.current) {
        leafletMapRef.current.invalidateSize();
      }
    });
    observer.observe(leafletContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Focus map on selected stop if triggered from outside
  useEffect(() => {
    if (selectedStop && leafletMapRef.current) {
      leafletMapRef.current.setView([selectedStop.lat, selectedStop.lng], 16, { animate: true });
    }
  }, [selectedStop]);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-[#E5DEAA] shadow-md bg-[#FAF8E7]/30 flex flex-col ${className}`}
      style={{ minHeight: '520px' }}
    >
      {/* Map Control Bar */}
      <div className="p-3 bg-white/95 backdrop-blur-sm border-b border-[#E5DEAA] flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40">
            <Compass className="w-4 h-4 text-[#1A8F82]" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#122B28] flex items-center gap-1.5">
              <span>{destinationStation.name}站 旅遊景點路線地圖</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E5FAF7] text-[#13695F] border border-[#81D8CF]/40 font-semibold">
                Google 導航連動
              </span>
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {hasValidGoogleKey && (
            <div className="flex items-center bg-[#FAF8E7] rounded-lg p-0.5 border border-[#E5DEAA] text-xs">
              <button
                type="button"
                onClick={() => setMapMode('osm')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  mapMode === 'osm' ? 'bg-[#1A8F82] shadow-xs text-white font-bold' : 'text-[#546E6A]'
                }`}
              >
                <MapIcon className="w-3 h-3" />
                <span>OpenStreetMap</span>
              </button>
              <button
                type="button"
                onClick={() => setMapMode('google')}
                className={`px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  mapMode === 'google' ? 'bg-[#1A8F82] shadow-xs text-white font-bold' : 'text-[#546E6A]'
                }`}
              >
                <Globe className="w-3 h-3" />
                <span>Google Maps</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowStationsLayer(!showStationsLayer)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center space-x-1 transition-colors cursor-pointer ${
              showStationsLayer
                ? 'bg-[#E5FAF7] text-[#13695F] border-[#81D8CF]/50'
                : 'bg-[#FAF8E7] text-[#546E6A] border-[#E5DEAA]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showStationsLayer ? '顯示全台車站' : '隱藏其他車站'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas with Guaranteed Fixed Height */}
      <div className="relative w-full flex-1" style={{ height: '480px', minHeight: '480px' }}>
        {mapMode === 'google' && hasValidGoogleKey ? (
          <APIProvider apiKey={apiKey} version="weekly">
            <GoogleMapComponent
              defaultCenter={{ lat: centerLat, lng: centerLng }}
              defaultZoom={14}
              mapId="TAIWAN_RAILWAY_MAP"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
            >
              {/* Destination Station Marker */}
              <AdvancedMarker position={{ lat: destinationStation.lat, lng: destinationStation.lng }}>
                <Pin background="#13695F" glyphColor="#F8F5D6" borderColor="#0F3A35" />
              </AdvancedMarker>

              {/* Itinerary Stops */}
              {stops.map((stop, idx) => (
                <AdvancedMarker key={stop.id || idx} position={{ lat: stop.lat, lng: stop.lng }} title={stop.placeName}>
                  <Pin
                    background={stop.category === 'food' ? '#8C7C20' : '#1A8F82'}
                    glyphColor="#FAF8E7"
                    glyph={`${idx + 1}`}
                  />
                </AdvancedMarker>
              ))}
            </GoogleMapComponent>
          </APIProvider>
        ) : (
          <div
            ref={leafletContainerRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%', minHeight: '480px' }}
          />
        )}

        {/* Floating Quick Legend */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-[#E5DEAA] text-[11px] text-[#122B28] flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#13695F]"></span>
            <span className="font-semibold">{destinationStation.name}火車站</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8C7C20]"></span>
            <span>必吃美食</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1A8F82]"></span>
            <span>推薦景點</span>
          </div>
        </div>

        {/* Floating External Google Maps Shortcut */}
        <div className="absolute bottom-3 right-3 z-[1000]">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destinationStation.name + '火車站 景點美食')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-[#0F3A35]/90 hover:bg-[#0F3A35] text-white text-xs font-bold shadow-lg border border-[#81D8CF]/30 flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-[#81D8CF]" />
            <span>開啟 Google 地圖全螢幕</span>
            <ExternalLink className="w-3 h-3 text-[#FAF8E7]/70" />
          </a>
        </div>
      </div>
    </div>
  );
};
