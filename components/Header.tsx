import React from 'react';
import type { View, Language, Translations } from '../types';
import { NavIcon, SunIcon, MoonIcon, LanguageIcon } from './common/Icon';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  t: Translations;
}

const Header: React.FC<HeaderProps> = ({
  currentView,
  setView,
  currentLanguage,
  setLanguage,
  isDarkMode,
  toggleDarkMode,
  t
}) => {
  const navItems: { view: View; label: string }[] = [
    { view: 'products', label: t.products },
    { view: 'locations', label: t.locations },
    { view: 'analytics', label: t.analytics },
    { view: 'search', label: t.search },
    { view: 'layout', label: t.storeLayout },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {t.dashboard}
            </h1>
            <nav className="hidden md:flex items-baseline space-x-4 mx-4" dir={currentLanguage === 'ar' ? 'rtl' : 'ltr'}>
              {navItems.map(item => (
                <button
                  key={item.view}
                  onClick={() => setView(item.view)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === item.view
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
             <div className="relative">
                <select 
                    value={currentLanguage} 
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="appearance-none bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md py-2 pl-8 pr-4 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                    <option value="ar">{t.arabic}</option>
                    <option value="fr">{t.french}</option>
                    <option value="de">{t.german}</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                    <LanguageIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isDarkMode ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden flex justify-around p-2 border-t border-gray-200 dark:border-gray-700">
            {navItems.map(item => (
                <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={`flex-1 flex flex-col items-center py-2 rounded-md text-xs font-medium transition-colors ${
                        currentView === item.view
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    >
                    <NavIcon view={item.view} />
                    {item.label}
                </button>
            ))}
        </div>

      </div>
    </header>
  );
};

export default Header;
