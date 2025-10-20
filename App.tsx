import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import ProductManagement from './components/ProductManagement';
import LocationManagement from './components/LocationManagement';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CustomerSearchView from './components/CustomerSearchView';
import type { View, Language, Product, Location, AnalyticsData } from './types';
import { INITIAL_PRODUCTS, INITIAL_LOCATIONS, INITIAL_ANALYTICS, TRANSLATIONS } from './constants';

function App() {
  const [view, setView] = useState<View>('products');
  const [language, setLanguage] = useState<Language>('fr');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [locations, setLocations] = useState<Location[]>(INITIAL_LOCATIONS);
  const [analytics] = useState<AnalyticsData>(INITIAL_ANALYTICS);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  
  const t = useMemo(() => TRANSLATIONS[language], [language]);
  
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock > 0 && p.stock < lowStockThreshold),
    [products, lowStockThreshold]
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [language, isDarkMode]);

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...product, id: Date.now() }]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: number) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAddLocation = (location: Omit<Location, 'id'>) => {
    setLocations(prev => [...prev, { ...location, id: Date.now() }]);
  };

  const handleUpdateLocation = (updatedLocation: Location) => {
    setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
  };

  const handleDeleteLocation = (locationId: number) => {
    setLocations(prev => prev.filter(l => l.id !== locationId));
    // Also unassign products from this location
    setProducts(prev => prev.map(p => p.locationId === locationId ? { ...p, locationId: 0 } : p));
  };
  
  const renderView = () => {
    switch(view) {
      case 'products':
        return <ProductManagement 
          products={products} 
          locations={locations}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          t={t}
          language={language}
          lowStockThreshold={lowStockThreshold}
          setLowStockThreshold={setLowStockThreshold}
        />;
      case 'locations':
        return <LocationManagement 
          locations={locations}
          onAddLocation={handleAddLocation}
          onUpdateLocation={handleUpdateLocation}
          onDeleteLocation={handleDeleteLocation}
          t={t}
        />;
      case 'analytics':
        return <AnalyticsDashboard 
          analytics={analytics} 
          products={products} 
          lowStockProducts={lowStockProducts}
          t={t} 
          language={language} 
        />;
      case 'search':
        return <CustomerSearchView products={products} locations={locations} t={t} language={language}/>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <Header
        currentView={view}
        setView={setView}
        currentLanguage={language}
        setLanguage={setLanguage}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        t={t}
      />
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
    </div>
  );
}

export default App;