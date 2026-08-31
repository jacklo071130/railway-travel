import React, { useEffect, useRef, useState } from 'react';
import { TRAStation, ItineraryStop } from '../types';

interface StaticPdfRouteMapProps {
  destinationStation: TRAStation;
  stops: ItineraryStop[];
  width?: number;
  height?: number;
  className?: string;
}

// Convert Lat/Lng to Web Mercator World Pixel at given Zoom level
function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * 256 * Math.pow(2, zoom);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * 256 * Math.pow(2, zoom);
  return { x, y };
}

// Calculate optimal zoom level based on bounding box
function getOptimalZoom(
  points: { lat: number; lng: number }[],
  canvasWidth: number,
  canvasHeight: number
): { zoom: number; centerLat: number; centerLng: number } {
  if (points.length === 0) {
    return { zoom: 15, centerLat: 25.04, centerLng: 121.55 };
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Search best zoom from 17 down to 11 with comfortable margin
  const padding = 55; // px padding inside canvas
  const targetW = canvasWidth - padding * 2;
  const targetH = canvasHeight - padding * 2;

  for (let z = 16; z >= 11; z--) {
    const pMin = latLngToWorldPixel(maxLat, minLng, z);
    const pMax = latLngToWorldPixel(minLat, maxLng, z);
    const w = Math.abs(pMax.x - pMin.x);
    const h = Math.abs(pMax.y - pMin.y);

    if (w <= targetW && h <= targetH) {
      return { zoom: z, centerLat, centerLng };
    }
  }

  return { zoom: 13, centerLat, centerLng };
}

export const StaticPdfRouteMap: React.FC<StaticPdfRouteMapProps> = ({
  destinationStation,
  stops = [],
  width = 738,
  height = 195,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mapDataUrl, setMapDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina resolution multiplier
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Collect all points: Station + all Stops
    const allPoints = [
      { lat: destinationStation.lat, lng: destinationStation.lng, name: `${destinationStation.name}火車站`, isStation: true },
      ...stops.map((s, idx) => ({ lat: s.lat, lng: s.lng, name: s.placeName, isStation: false, index: idx + 1 }))
    ];

    const { zoom, centerLat, centerLng } = getOptimalZoom(allPoints, width, height);
    const centerWorld = latLngToWorldPixel(centerLat, centerLng, zoom);

    // Helper: convert (lat, lng) to canvas local (x, y)
    const toCanvasCoord = (lat: number, lng: number) => {
      const p = latLngToWorldPixel(lat, lng, zoom);
      const canvasX = width / 2 + (p.x - centerWorld.x);
      const canvasY = height / 2 + (p.y - centerWorld.y);
      return { x: canvasX, y: canvasY };
    };

    // 1. Draw Clean Scenic Cartographic Map Background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#F5F3E9');
    bgGradient.addColorStop(0.5, '#ECE8D9');
    bgGradient.addColorStop(1, '#E4DFCE');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Cartographic Grid & Topographic Contour Lines
    ctx.save();
    ctx.strokeStyle = 'rgba(180, 172, 148, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    for (let x = 20; x < width; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 20; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();

    // Natural geographic terrain contours (Topographic aesthetic)
    ctx.save();
    ctx.strokeStyle = 'rgba(15, 58, 53, 0.08)';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      const cy = height * (0.2 + i * 0.22);
      ctx.moveTo(0, cy);
      ctx.bezierCurveTo(width * 0.25, cy - 25, width * 0.7, cy + 30, width, cy - 10);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Connective Road Network / Secondary Paths
    const screenPoints = allPoints.map((p) => toCanvasCoord(p.lat, p.lng));
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < screenPoints.length; i++) {
      const p1 = screenPoints[i];
      const p2 = screenPoints[(i + 1) % screenPoints.length];
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    const drawOverlays = () => {
      // 3. Draw Connecting Route Polyline with Smooth Dash & Shadow
      const screenPoints = allPoints.map((p) => toCanvasCoord(p.lat, p.lng));

      if (screenPoints.length > 1) {
        // Shadow line
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        // Connect back to station to complete loop
        ctx.lineTo(screenPoints[0].x, screenPoints[0].y);

        ctx.strokeStyle = 'rgba(15, 58, 53, 0.25)';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Main Route Path (Teal)
        ctx.beginPath();
        ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
        for (let i = 1; i < screenPoints.length; i++) {
          ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
        }
        ctx.lineTo(screenPoints[0].x, screenPoints[0].y);

        ctx.strokeStyle = '#1A8F82';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([7, 4]);
        ctx.stroke();
        ctx.restore();

        // Draw direction arrows along paths
        for (let i = 0; i < screenPoints.length; i++) {
          const from = screenPoints[i];
          const to = screenPoints[(i + 1) % screenPoints.length];
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          const angle = Math.atan2(to.y - from.y, to.x - from.x);

          ctx.save();
          ctx.translate(midX, midY);
          ctx.rotate(angle);
          ctx.fillStyle = '#13695F';
          ctx.beginPath();
          ctx.moveTo(5, 0);
          ctx.lineTo(-4, -3.5);
          ctx.lineTo(-2, 0);
          ctx.lineTo(-4, 3.5);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Draw Markers & Labels
      // Station Marker
      const stationCoord = screenPoints[0];
      if (stationCoord) {
        // Station Pin Outer Ring
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#0F3A35';
        ctx.beginPath();
        ctx.arc(stationCoord.x, stationCoord.y, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FAF8E7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Train Icon representation
        ctx.fillStyle = '#FAF8E7';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚆', stationCoord.x, stationCoord.y + 0.5);

        // Station Pill Label
        const stationLabel = `🚉 ${destinationStation.name}站 (起點/賦歸)`;
        ctx.font = 'bold 9.5px sans-serif';
        const stWidth = ctx.measureText(stationLabel).width + 12;
        const stX = stationCoord.x;
        const stY = stationCoord.y - 19;

        // Label Background
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#0F3A35';
        ctx.beginPath();
        ctx.roundRect(stX - stWidth / 2, stY - 8, stWidth, 16, 4);
        ctx.fill();
        ctx.strokeStyle = '#81D8CF';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stationLabel, stX, stY);
        ctx.restore();
      }

      // Spot Markers (1, 2, 3, 4)
      for (let i = 1; i < screenPoints.length; i++) {
        const spotCoord = screenPoints[i];
        const spot = stops[i - 1];
        if (!spotCoord || !spot) continue;

        // Marker Drop Shadow & Pin Circle
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = '#1A8F82';
        ctx.beginPath();
        ctx.arc(spotCoord.x, spotCoord.y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();

        // Number inside pin
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(i), spotCoord.x, spotCoord.y);

        // Spot Name Badge
        const spotLabel = `${i}. ${spot.placeName}`;
        ctx.font = 'bold 9px sans-serif';
        const labelWidth = ctx.measureText(spotLabel).width + 10;
        
        // Offset label smartly to avoid canvas edges
        let offsetX = 0;
        let offsetY = -17;
        if (spotCoord.y < 35) offsetY = 17;
        if (spotCoord.x - labelWidth / 2 < 10) offsetX = labelWidth / 2 - spotCoord.x + 10;
        if (spotCoord.x + labelWidth / 2 > width - 10) offsetX = (width - 10) - (spotCoord.x + labelWidth / 2);

        const lblX = spotCoord.x + offsetX;
        const lblY = spotCoord.y + offsetY;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(lblX - labelWidth / 2, lblY - 7, labelWidth, 14, 3);
        ctx.fill();

        ctx.strokeStyle = '#1A8F82';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.fillStyle = '#122B28';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(spotLabel, lblX, lblY);
        ctx.restore();
      }

      // 5. Compass Indicator (Top Right)
      ctx.save();
      const compX = width - 24;
      const compY = 22;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(compX, compY, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#E5DEAA';
      ctx.lineWidth = 1;
      ctx.stroke();

      // North Arrow
      ctx.fillStyle = '#E53E3E';
      ctx.beginPath();
      ctx.moveTo(compX, compY - 10);
      ctx.lineTo(compX - 3.5, compY + 2);
      ctx.lineTo(compX, compY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#718096';
      ctx.beginPath();
      ctx.moveTo(compX, compY - 10);
      ctx.lineTo(compX + 3.5, compY + 2);
      ctx.lineTo(compX, compY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#122B28';
      ctx.font = 'bold 7.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('N', compX, compY + 9);
      ctx.restore();

      // 6. Map Title Tag (Top Left)
      ctx.save();
      const tagText = `🗺️ ${destinationStation.name}一日遊行程路線圖 (全 ${stops.length} 個景點)`;
      ctx.font = 'bold 9.5px sans-serif';
      const tagW = ctx.measureText(tagText).width + 14;
      ctx.fillStyle = 'rgba(15, 58, 53, 0.92)';
      ctx.beginPath();
      ctx.roundRect(8, 8, tagW, 19, 5);
      ctx.fill();
      ctx.strokeStyle = '#81D8CF';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#FAF8E7';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(tagText, 15, 17.5);
      ctx.restore();

      // 7. Footer Attribution & Scale Info (Bottom Right)
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '8px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('© OpenStreetMap / CARTO • GPS衛星定點座標', width - 8, height - 5);
      ctx.restore();

      // Export canvas to high-definition PNG Data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.96);
        setMapDataUrl(dataUrl);
      } catch (err) {
        console.warn('Canvas export toDataURL note:', err);
      }
    };

    // Draw route, pins, and map labels immediately
    drawOverlays();
  }, [destinationStation, stops, width, height]);

  return (
    <div className={`relative rounded-lg overflow-hidden border border-[#E5DEAA] shadow-xs bg-[#FAF8E7] ${className}`}>
      {/* Hidden high-res canvas used for rendering */}
      <canvas
        ref={canvasRef}
        style={{ width: `${width}px`, height: `${height}px` }}
        className={mapDataUrl ? 'hidden' : 'block w-full h-auto'}
      />

      {/* Rendered Map Image once generated */}
      {mapDataUrl ? (
        <img
          src={mapDataUrl}
          alt={`行程路線地圖 - ${destinationStation.name}`}
          className="w-full h-auto block object-cover"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
      ) : (
        <div 
          className="flex items-center justify-center bg-[#FAF8E7] text-[#546E6A] text-xs font-semibold"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <span>正在繪製行程路線地圖...</span>
        </div>
      )}
    </div>
  );
};
