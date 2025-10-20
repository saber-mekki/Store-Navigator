import React from 'react';
import type { AnalyticsData, Product, Translations, Language } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { SearchIcon, WarningIcon } from './common/Icon';

interface AnalyticsDashboardProps {
  analytics: AnalyticsData;
  products: Product[];
  lowStockProducts: Product[];
  t: Translations;
  language: Language;
}

const StatCard: React.FC<{ title: string; value: string | number; children: React.ReactNode }> = ({ title, value, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-full">
            {children}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);


const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ analytics, products, lowStockProducts, t, language }) => {
  const totalProducts = products.length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const mostSearched = analytics.topSearches[0]?.term || 'N/A';

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t.reportsAndAnalytics}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t.totalProducts} value={totalProducts}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        </StatCard>
        <StatCard title={t.outOfStock} value={outOfStock}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </StatCard>
         <StatCard title={t.lowStockItems} value={lowStockProducts.length}>
            <WarningIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </StatCard>
        <StatCard title={t.mostSearched} value={mostSearched}>
            <SearchIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </StatCard>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="font-bold mb-4">{t.topSearches}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topSearches} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="term" type="category" width={80} stroke="#9ca3af" />
              <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e5e7eb' }} />
              <Bar dataKey="count" fill="#3b82f6" name={t.searchCount} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold mb-4">{t.peakTimes}</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.peakTimes} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                    <XAxis dataKey="hour" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e5e7eb' }} />
                    <Legend />
                    <Line type="monotone" dataKey="searches" stroke="#3b82f6" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="font-bold mb-4 text-lg">{t.lowStockProducts}</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">{t.productName}</th>
                            <th scope="col" className="px-6 py-3">{t.category}</th>
                            <th scope="col" className="px-6 py-3 text-right">{t.stockRemaining}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lowStockProducts.map(product => (
                            <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                    <div className="flex items-center">
                                        <img src={product.imageUrl} alt={product.name[language]} className="w-8 h-8 rounded-full mr-3 object-cover" />
                                        <span>{product.name[language]}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{product.category[language]}</td>
                                <td className="px-6 py-4 text-right font-bold text-yellow-500">{product.stock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;