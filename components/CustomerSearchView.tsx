import React, { useState } from 'react';
import type { Product, Location, Translations, Language } from '../types';
import { searchProducts, generateDirections } from '../services/geminiService';
import { SearchIcon, LoadingIcon } from './common/Icon';
import StoreMapView from './StoreMapView';

interface CustomerSearchViewProps {
  products: Product[];
  locations: Location[];
  t: Translations;
  language: Language;
}

const CustomerSearchView: React.FC<CustomerSearchViewProps> = ({ products, locations, t, language }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<Product | null | undefined>(undefined); // undefined: not searched, null: not found
  const [directions, setDirections] = useState<string>('');
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);

  const getProductLocation = (productId: number): Location | null => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return locations.find(l => l.id === product.locationId) || null;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setSearchResult(undefined);
    setDirections('');
    try {
      const result = await searchProducts(query, products, language);
      setSearchResult(result);

      if (result) {
        const location = getProductLocation(result.id);
        if (location) {
          setIsGeneratingDirections(true);
          try {
            const generated = await generateDirections(location, language);
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
  
  const foundLocation = searchResult ? getProductLocation(searchResult.id) : null;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{t.customerSearch}</h2>
        <form onSubmit={handleSearch} className="flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchForProduct}
            className="flex-grow p-3 rounded-l-lg border-2 border-r-0 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-primary-500 hover:bg-primary-600 text-white font-bold p-3 rounded-r-lg flex items-center justify-center w-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isGeneratingDirections}
          >
            {isLoading ? <LoadingIcon /> : <SearchIcon className="h-6 w-6" />}
          </button>
        </form>
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

              {foundLocation && (
                <div>
                  <h4 className="text-xl font-bold mb-2">{t.productLocation}</h4>
                  <p className="text-lg mb-2">
                    {`${t.floor} ${foundLocation.floor}, ${t.aisle} ${foundLocation.aisle}, ${t.shelf} ${foundLocation.shelf}, ${t.bin} ${foundLocation.bin}`}
                  </p>
                   <StoreMapView location={foundLocation} t={t} />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t.productNotFound}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSearchView;
