import React from 'react';
import type { Location, Translations } from '../types';

interface StoreMapViewProps {
  location: Location | null;
  t: Translations;
}

// Store layout configuration
const AISLE_COUNT = 6;
const SHELVES_PER_AISLE = 5;
const VIEWBOX_WIDTH = 400;
const VIEWBOX_HEIGHT = 300;
const AISLE_WIDTH = 40;
const AISLE_HEIGHT = 180;
const AISLE_Y_START = 20;
const AISLE_GAP = (VIEWBOX_WIDTH - (AISLE_COUNT * AISLE_WIDTH)) / (AISLE_COUNT + 1);
const ENTRANCE_POS = { x: VIEWBOX_WIDTH / 2, y: VIEWBOX_HEIGHT - 10 };

const StoreMapView: React.FC<StoreMapViewProps> = ({ location, t }) => {
  if (!location) {
    return null;
  }

  const getAisleX = (aisleNumber: number) => {
    return AISLE_GAP + (aisleNumber - 1) * (AISLE_WIDTH + AISLE_GAP);
  };
  
  const getShelfY = (shelfNumber: number) => {
      return AISLE_Y_START + (AISLE_HEIGHT / SHELVES_PER_AISLE) * (shelfNumber - 0.5);
  };

  const productAisleX = getAisleX(location.aisle);
  const productShelfY = getShelfY(location.shelf);
  const productPos = { x: productAisleX + AISLE_WIDTH / 2, y: productShelfY };

  // Path points
  const pathPoints = [
    `${ENTRANCE_POS.x},${ENTRANCE_POS.y}`, // Start
    `${ENTRANCE_POS.x},${AISLE_Y_START + AISLE_HEIGHT + 20}`, // Move up from entrance
    `${productPos.x},${AISLE_Y_START + AISLE_HEIGHT + 20}`, // Move horizontally to aisle line
    `${productPos.x},${productPos.y}`, // Move down the aisle
  ].join(' ');

  return (
    <div className="mt-4">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
        {t.floor} {location.floor} Map
      </h3>
      <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
        <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="w-full h-full">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Aisles */}
          {[...Array(AISLE_COUNT)].map((_, i) => (
            <g key={`aisle-group-${i}`}>
              <rect
                key={`aisle-${i}`}
                x={getAisleX(i + 1)}
                y={AISLE_Y_START}
                width={AISLE_WIDTH}
                height={AISLE_HEIGHT}
                className="fill-gray-300 dark:fill-gray-600"
                rx="2"
              />
              <text
                x={getAisleX(i + 1) + AISLE_WIDTH / 2}
                y={AISLE_Y_START - 5}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-gray-500 dark:fill-gray-400"
              >
                {t.aisle} {i + 1}
              </text>
            </g>
          ))}
          
          {/* Path */}
          <polyline
            points={pathPoints}
            className="fill-none stroke-red-500"
            strokeWidth="2"
            strokeDasharray="4 4"
            markerEnd="url(#arrow)"
          />

          {/* Start Point */}
          <g>
            <circle cx={ENTRANCE_POS.x} cy={ENTRANCE_POS.y} r="5" className="fill-green-500" />
            <text x={ENTRANCE_POS.x} y={ENTRANCE_POS.y + 15} textAnchor="middle" className="text-[8px] font-bold fill-gray-700 dark:fill-gray-200">{t.yourLocation}</text>
          </g>

          {/* Product Location */}
          <g>
             <circle cx={productPos.x} cy={productPos.y} r="8" className="fill-primary-500 opacity-50" />
             <circle cx={productPos.x} cy={productPos.y} r="4" className="fill-primary-600" />
             <text x={productPos.x} y={productPos.y - 12} textAnchor="middle" className="text-[8px] font-bold fill-primary-700 dark:fill-primary-300 animate-pulse">{t.productIsHere}</text>
          </g>

        </svg>
      </div>
    </div>
  );
};

export default StoreMapView;
