import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Product, Location, Translations, Language } from '../types';
import { generateDescription, generateImage } from '../services/geminiService';
import { EditIcon, DeleteIcon, PlusIcon, AIGenerateIcon, LoadingIcon, WarningIcon, QRIcon } from './common/Icon';

interface ProductManagementProps {
  products: Product[];
  locations: Location[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  t: Translations;
  language: Language;
  lowStockThreshold: number;
  setLowStockThreshold: (value: number) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({
  products,
  locations,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  t,
  language,
  lowStockThreshold,
  setLowStockThreshold,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<Product | null>(null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const emptyProductForm: Partial<Product> = {
    name: { ar: '', fr: '', de: '' },
    category: { ar: '', fr: '', de: '' },
    description: { ar: '', fr: '', de: '' },
    barcode: '',
    price: 0,
    stock: 0,
    locationId: locations[0]?.id || 1,
    imageUrl: '',
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(emptyProductForm);

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    products.forEach(p => categories.add(p.category[language]));
    return ['all', ...Array.from(categories)];
  }, [products, language]);
  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      if (categoryFilter !== 'all' && product.category[language] !== categoryFilter) {
        return false;
      }
      if (stockFilter === 'inStock' && product.stock === 0) {
        return false;
      }
      if (stockFilter === 'outOfStock' && product.stock > 0) {
        return false;
      }
      if (locationFilter !== 'all' && product.locationId !== parseInt(locationFilter, 10)) {
        return false;
      }
      return true;
    });
  }, [products, categoryFilter, stockFilter, locationFilter, language]);

  const handleClearFilters = () => {
    setCategoryFilter('all');
    setStockFilter('all');
    setLocationFilter('all');
  };
  
  const stopScan = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }
    setIsScanning(false);
  };
  
  const handleScanSuccess = (data: string) => {
    stopScan();
    try {
        const parsedData = JSON.parse(data);
        const newProduct = {
            ...emptyProductForm,
            ...parsedData,
            name: { ...emptyProductForm.name, ...parsedData.name},
            category: { ...emptyProductForm.category, ...parsedData.category},
            description: { ...emptyProductForm.description, ...parsedData.description},
        };
        setProductForm(newProduct);
        setEditingProduct(null);
        setIsModalOpen(true);
    } catch(e) {
        console.error("Failed to parse QR code data", e);
        alert("Invalid QR code data format.");
    }
  };


  useEffect(() => {
    if (!isScanning) {
        return;
    }
    
    if (!('BarcodeDetector' in window)) {
        alert('Barcode Detector is not supported by this browser.');
        setIsScanning(false);
        return;
    }
    
    const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
    let animationFrameId: number;
    
    const startScan = async () => {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if(videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();
            detectCode();
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        alert("Camera access is required to scan QR codes.");
        stopScan();
      }
    };
    
    const detectCode = async () => {
        if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
                const barcodes = await barcodeDetector.detect(videoRef.current);
                if (barcodes.length > 0) {
                    handleScanSuccess(barcodes[0].rawValue);
                    return;
                }
            } catch (e) {
                console.error("Barcode detection failed:", e);
            }
        }
        animationFrameId = requestAnimationFrame(detectCode);
    };

    startScan();

    return () => {
        cancelAnimationFrame(animationFrameId);
        stopScan();
    };
}, [isScanning]);


  const handleAddProductClick = () => {
    setEditingProduct(null);
    setProductForm(emptyProductForm);
    setIsModalOpen(true);
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setIsDeleting(product);
  };

  const confirmDelete = () => {
    if (isDeleting) {
      onDeleteProduct(isDeleting.id);
      setIsDeleting(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'name' || name === 'category' || name === 'description') {
      setProductForm(prev => ({
        ...prev,
        [name]: { ...(prev as any)[name], [language]: value }
      }));
    } else if (name === 'price') {
      setProductForm(prev => ({ ...prev, price: parseFloat(value) || 0 }));
    } else if (name === 'stock' || name === 'locationId') {
      setProductForm(prev => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setProductForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleGenerateDescription = async () => {
    if (!productForm.name?.[language] || !productForm.category?.[language]) {
      alert('Please enter product name and category first.');
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const desc = await generateDescription(productForm.name[language], productForm.category[language], language);
      setProductForm(prev => ({ ...prev, description: { ...prev.description, [language]: desc } }));
    } catch (error) {
      console.error(error);
      alert('Failed to generate description.');
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!productForm.name?.[language] || !productForm.category?.[language]) {
      alert('Please enter product name and category first.');
      return;
    }
    setIsGeneratingImg(true);
    try {
      const url = await generateImage(productForm.name[language], productForm.category[language]);
      setProductForm(prev => ({ ...prev, imageUrl: url }));
    } catch (error) {
      console.error(error);
      alert('Failed to generate image.');
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(productForm as Product);
    } else {
      onAddProduct(productForm as Product);
    }
    closeModal();
  };

  const getLocationString = (locationId: number) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return 'N/A';
    return `${t.aisle} ${loc.aisle}, ${t.shelf} ${loc.shelf}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.productManagement}</h2>
        <div className="flex space-x-2">
            <button
                onClick={() => setIsScanning(true)}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
            >
                <QRIcon /> <span className="ml-2">{t.scanProduct}</span>
            </button>
            <button
            onClick={handleAddProductClick}
            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
            >
            <PlusIcon /> <span className="ml-2">{t.addProduct}</span>
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.filterByCategory}</label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
          >
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? t.all : cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stockFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.filterByStock}</label>
          <select
            id="stockFilter"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">{t.all}</option>
            <option value="inStock">{t.inStock}</option>
            <option value="outOfStock">{t.outOfStock}</option>
          </select>
        </div>
        <div>
          <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.filterByLocation}</label>
          <select
            id="locationFilter"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
          >
            <option value="all">{t.all}</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{`${t.floor} ${loc.floor}, ${t.aisle} ${loc.aisle}, ${t.shelf} ${loc.shelf}`}</option>
            ))}
          </select>
        </div>
        <div>
            <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.lowStockThreshold}</label>
            <input
                type="number"
                id="lowStockThreshold"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(parseInt(e.target.value, 10) || 0)}
                className="mt-1 block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md dark:bg-gray-800 dark:border-gray-600"
            />
        </div>
        <div className="flex items-end">
            <button
                onClick={handleClearFilters}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
            >
                {t.clearFilters}
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">{t.productName}</th>
              <th scope="col" className="px-6 py-3">{t.category}</th>
              <th scope="col" className="px-6 py-3">{t.price}</th>
              <th scope="col" className="px-6 py-3">{t.stock}</th>
              <th scope="col" className="px-6 py-3">{t.location}</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                  <div className="flex items-center">
                    <img src={product.imageUrl} alt={product.name[language]} className="w-10 h-10 rounded-full mr-4 object-cover" />
                    <span>{product.name[language]}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{product.category[language]}</td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  {product.stock > 0 && product.stock < lowStockThreshold ? (
                    <span className="flex items-center text-yellow-500 font-bold">
                      <WarningIcon className="h-5 w-5 mr-1" />
                      {product.stock}
                    </span>
                  ) : (
                    <span>{product.stock}</span>
                  )}
                </td>
                <td className="px-6 py-4">{getLocationString(product.locationId)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditProductClick(product)} className="text-primary-600 dark:text-primary-400 hover:underline mr-4"><EditIcon /></button>
                  <button onClick={() => handleDeleteClick(product)} className="text-red-600 dark:text-red-400 hover:underline"><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isScanning && (
         <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">{t.scanProductQRCode}</h3>
                <div className="relative w-full aspect-square bg-gray-900 rounded-lg overflow-hidden">
                    <video ref={videoRef} playsInline className="w-full h-full object-cover" />
                    <div className="absolute inset-0 border-4 border-dashed border-green-500 rounded-lg"></div>
                </div>
                <div className="flex justify-center mt-4">
                    <button type="button" onClick={stopScan} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">{t.cancel}</button>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingProduct ? t.editProduct : t.addProduct}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">{t.productName}</label>
                  <input type="text" name="name" value={productForm.name?.[language] || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.category}</label>
                  <input type="text" name="category" value={productForm.category?.[language] || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">{t.description}</label>
                <div className="flex items-center">
                  <textarea name="description" value={productForm.description?.[language] || ''} onChange={handleFormChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"></textarea>
                  <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc} className="ml-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-3 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGeneratingDesc ? <LoadingIcon /> : <AIGenerateIcon />}
                    <span className="ml-1 hidden sm:inline">{t.generateWithAI}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">{t.barcode}</label>
                  <input type="text" name="barcode" value={productForm.barcode || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.location}</label>
                  <select name="locationId" value={productForm.locationId} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required>
                    {locations.map(loc => <option key={loc.id} value={loc.id}>{`${t.floor} ${loc.floor}, ${t.aisle} ${loc.aisle}, ${t.shelf} ${loc.shelf}, ${t.bin} ${loc.bin}`}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">{t.price}</label>
                  <input type="number" name="price" value={productForm.price || ''} onChange={handleFormChange} step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.stock}</label>
                  <input type="number" name="stock" value={productForm.stock || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium">{t.imageURL}</label>
                <div className="flex items-center">
                  <input type="text" name="imageUrl" value={productForm.imageUrl || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" />
                  <button type="button" onClick={handleGenerateImage} disabled={isGeneratingImg} className="ml-2 bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-2 px-3 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isGeneratingImg ? <LoadingIcon /> : <AIGenerateIcon />}
                    <span className="ml-1 hidden sm:inline">{t.generateWithAI}</span>
                  </button>
                </div>
                {productForm.imageUrl && <img src={productForm.imageUrl} alt="Product preview" className="mt-2 h-24 w-24 object-cover rounded-lg" />}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">{t.cancel}</button>
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t.deleteProduct}</h3>
            <p className="mb-6">{t.confirmDelete}</p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setIsDeleting(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">{t.cancel}</button>
              <button onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;