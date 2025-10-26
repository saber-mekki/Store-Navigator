import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { Product, Location, Translations, Language, StoreLayout } from '../types';
import { searchProducts, generateDirections } from '../services/geminiService';
import { SearchIcon, LoadingIcon, ExpandIcon, CompressIcon } from './common/Icon';
import StoreMapView from './StoreMapView';

interface CustomerSearchViewProps {
  products: Product[];
  locations: Location[];
  t: Translations;
  language: Language;
  storeLayout: StoreLayout;
}

const CustomerSearchView: React.FC<CustomerSearchViewProps> = ({ products, locations, t, language, storeLayout }) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Product | null | undefined>(undefined); // undefined: not searched, null: not found
  const [directions, setDirections] = useState<string>('');
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const allAisles = useMemo(() => storeLayout.floors.flatMap(f => f.aisles), [storeLayout]);

  // Debounce user input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const getProductLocation = useCallback((productId: number): Location | null => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return locations.find(l => l.id === product.locationId) || null;
  }, [products, locations]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResult(undefined);
        setDirections('');
        return;
      }

      setIsLoading(true);
      setSearchResult(undefined);
      setDirections('');
      try {
        const result = await searchProducts(debouncedQuery, products, language);
        setSearchResult(result);

        if (result) {
          const location = getProductLocation(result.id);
          const aisle = location ? allAisles.find(a => a.id === location.aisleId) : null;
          if (location && aisle) {
            setIsGeneratingDirections(true);
            try {
              const directionsObject = { aisle: aisle.name, shelf: location.shelf, bin: location.bin, floor: location.floor };
              const generated = await generateDirections(directionsObject, language);
              setDirections(generated);
            } catch (dirError) {
              console.error(dirError);
              setDirections("Could not generate directions.");
            } finally {
              setIsGeneratingDirections(false);
            }
          }
        }
      } catch (error) {
        console.error(error);
        alert('Search failed. Please try again.');
        setSearchResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, products, language, allAisles, getProductLocation]);

  // Handle fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Prevent body scroll when in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup in case component unmounts while in fullscreen
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);


  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const foundLocation = searchResult ? getProductLocation(searchResult.id) : null;
  const foundAisle = foundLocation ? allAisles.find(a => a.id === foundLocation.aisleId) : null;
  const floorLayoutForMap = foundLocation ? storeLayout.floors.find(f => f.floorNumber === foundLocation.floor) : null;

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[100] bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 lg:p-8 overflow-y-auto'
          : 'max-w-4xl mx-auto'
      }
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t.customerSearch}</h2>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? <CompressIcon className="h-6 w-6" /> : <ExpandIcon className="h-6 w-6" />}
          </button>
        </div>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchForProduct}
                className="w-full p-3 pl-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            />
            {isLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <LoadingIcon />
                </div>
            )}
        </div>
      </div>

      {searchResult !== undefined && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">{t.searchResult}</h3>
          {searchResult ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center space-x-4">
                  <img src={searchResult.imageUrl} alt={searchResult.name[language]} className="w-24 h-24 rounded-lg object-cover" />
                  <div>
                    <h4 className="text-2xl font-bold">{searchResult.name[language]}</h4>
                    <p className="text-gray-600 dark:text-gray-300">{searchResult.category[language]}</p>
                    <p className="text-lg font-semibold mt-1">${searchResult.price.toFixed(2)}</p>
                    <p className={`mt-1 font-bold ${searchResult.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {searchResult.stock > 0 ? `${t.stock}: ${searchResult.stock}` : t.outOfStock}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                   <h4 className="text-xl font-bold mb-2">{t.directions}</h4>
                   {isGeneratingDirections ? (
                      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                        <LoadingIcon /> <span>{t.generatingDirections}</span>
                      </div>
                   ) : (
                     <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                        {directions.split('\n').map((line, i) => line.trim() && <li key={i}>{line.replace(/^\d+\.\s*/, '')}</li>)}
                     </ol>
                   )}
                </div>

              </div>

              {foundLocation && floorLayoutForMap && (
                <div>
                  <h4 className="text-xl font-bold mb-2">{t.productLocation}</h4>
                  <p className="text-lg mb-2">
                     {foundAisle ? `${t.floor} ${foundLocation.floor}, ${foundAisle.name}, ${t.shelf} ${foundLocation.shelf}, ${t.bin} ${foundLocation.bin}` : 'Location details unavailable'}
                  </p>
                   <StoreMapView 
                     location={foundLocation} 
                     layout={{
                        storeWidth: storeLayout.storeWidth,
                        storeHeight: storeLayout.storeHeight,
                        aisles: floorLayoutForMap.aisles,
                        entranceX: floorLayoutForMap.entranceX,
                        entranceY: floorLayoutForMap.entranceY,
                     }}
                     t={t} 
                   />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t.productNotFound}</p>
          )}
        </div>
      )}
      
      {searchResult === undefined && !isLoading && (
        <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
          <p>{t.typeToSearch}</p>
        </div>
      )}
    </div>
  );
};

export default CustomerSearchView;