import React from 'react';
import type { Location, Translations, Aisle } from '../types';

// This interface now represents the layout of a single floor
interface SingleFloorLayout {
    aisles: Aisle[];
    storeWidth: number;
    storeHeight: number;
    entranceX: number;
    entranceY: number;
}
interface StoreMapViewProps {
  location: Location | null;
  layout: SingleFloorLayout;
  t: Translations;
  selectedAisleId?: number | null;
  draggingAisleId?: number | null;
  isDraggingEntrance?: boolean;
  onAisleMouseDown?: (e: React.MouseEvent<SVGGElement>, aisle: Aisle) => void;
  onEntranceMouseDown?: (e: React.MouseEvent<SVGGElement>) => void;
  onMouseMove?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onMouseUp?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

const StoreMapView: React.FC<StoreMapViewProps> = ({ 
  location, 
  layout, 
  t, 
  selectedAisleId,
  draggingAisleId,
  isDraggingEntrance,
  onAisleMouseDown,
  onEntranceMouseDown,
  onMouseMove,
  onMouseUp
 }) => {
  const VIEWBOX_WIDTH = layout.storeWidth;
  const VIEWBOX_HEIGHT = layout.storeHeight;
  const entrancePos = { x: layout.entranceX, y: layout.entranceY };

  const productAisle = location ? layout.aisles.find(a => a.id === location.aisleId) : null;

  const getProductPos = (loc: Location, aisle: Aisle) => {
    if (aisle.orientation === 'vertical') {
        const y = aisle.y + (aisle.height / aisle.shelves) * (loc.shelf - 0.5);
        return { x: aisle.x + aisle.width / 2, y };
    } else { // horizontal
        const x = aisle.x + (aisle.width / aisle.shelves) * (loc.shelf - 0.5);
        return { x, y: aisle.y + aisle.height / 2 };
    }
  }

  const productPos = location && productAisle ? getProductPos(location, productAisle) : null;
  
  const pathPoints = productPos && productAisle ? [
    `${entrancePos.x},${entrancePos.y}`, // Start at entrance
    `${entrancePos.x},${productAisle.y + productAisle.height + 10}`, // Move up from entrance
    `${productPos.x},${productAisle.y + productAisle.height + 10}`, // Move horizontally to aisle line
    `${productPos.x},${productPos.y}`, // Move down/up the aisle path to the product
  ].join(' ') : '';


  return (
    <div className="mt-4">
      {location && (
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
          {t.floor} {location?.floor || 1} Map
        </h3>
      )}
      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        <svg 
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} 
          className={`w-full h-full ${draggingAisleId || isDraggingEntrance ? 'cursor-grabbing' : ''}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp} // Stop dragging if mouse leaves SVG
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Aisles */}
          {layout.aisles.map((aisle) => {
            const isSelected = selectedAisleId === aisle.id;
            const isDragging = draggingAisleId === aisle.id;
            return (
                <g key={`aisle-group-${aisle.id}`} 
                   onMouseDown={(e) => onAisleMouseDown && onAisleMouseDown(e, aisle)}
                   className={onAisleMouseDown ? 'cursor-grab' : ''}
                >
                <rect
                    key={`aisle-${aisle.id}`}
                    x={aisle.x}
                    y={aisle.y}
                    width={aisle.width}
                    height={aisle.height}
                    className={`transition-colors duration-200 
                        ${isSelected ? 'stroke-primary-500 stroke-2 fill-primary-200 dark:fill-primary-800' : 'stroke-none fill-gray-300 dark:fill-gray-600'}
                        ${isDragging ? 'opacity-70' : ''}
                    `}
                    rx="2"
                />
                <text
                    x={aisle.x + aisle.width / 2}
                    y={aisle.y + aisle.height / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[8px] font-semibold fill-gray-600 dark:fill-gray-300 pointer-events-none"
                >
                    {aisle.name}
                </text>
                </g>
            )
          })}
          
          {productPos && (
            <>
              {/* Path */}
              <polyline
                points={pathPoints}
                className="fill-none stroke-red-500"
                strokeWidth="2"
                strokeDasharray="4 4"
                markerEnd="url(#arrow)"
              />

              {/* Product Location */}
              <g>
                 <circle cx={productPos.x} cy={productPos.y} r="8" className="fill-primary-500 opacity-50" />
                 <circle cx={productPos.x} cy={productPos.y} r="4" className="fill-primary-600" />
                 <text x={productPos.x} y={productPos.y - 12} textAnchor="middle" className="text-[8px] font-bold fill-primary-700 dark:fill-primary-300 animate-pulse">{t.productIsHere}</text>
              </g>
            </>
          )}

          {/* Start Point */}
          <g 
            onMouseDown={onEntranceMouseDown}
            className={onEntranceMouseDown ? 'cursor-grab' : ''}
          >
            <circle cx={entrancePos.x} cy={entrancePos.y} r="5" className="fill-green-500" />
            <text x={entrancePos.x} y={entrancePos.y + 15} textAnchor="middle" className="text-[8px] font-bold fill-gray-700 dark:fill-gray-200 pointer-events-none">{t.yourLocation}</text>
          </g>

        </svg>
      </div>
    </div>
  );
};

export default StoreMapView;