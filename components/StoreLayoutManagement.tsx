import React, { useState, useRef, useMemo } from 'react';
import type { StoreLayout, Translations, Aisle, FloorLayout } from '../types';
import StoreMapView from './StoreMapView';
import { PlusIcon, EditIcon, DeleteIcon } from './common/Icon';

interface StoreLayoutManagementProps {
  storeLayout: StoreLayout;
  onUpdateLayout: (layout: StoreLayout) => void;
  t: Translations;
}

const StoreLayoutManagement: React.FC<StoreLayoutManagementProps> = ({ storeLayout, onUpdateLayout, t }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAisle, setEditingAisle] = useState<Aisle | null>(null);
  const [selectedAisleId, setSelectedAisleId] = useState<number | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(storeLayout.floors[0]?.floorNumber || 1);

  const [draggingAisleId, setDraggingAisleId] = useState<number | null>(null);
  const [isDraggingEntrance, setIsDraggingEntrance] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const currentFloorLayout = useMemo(() => {
    return storeLayout.floors.find(f => f.floorNumber === currentFloor) || null;
  }, [storeLayout, currentFloor]);
  
  const emptyAisle: Omit<Aisle, 'id'> = {
    name: 'New Aisle',
    x: 10, y: 10, width: 30, height: 150,
    orientation: 'vertical',
    shelves: 5
  };

  const [aisleForm, setAisleForm] = useState<Omit<Aisle, 'id'> | Aisle>(emptyAisle);
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onUpdateLayout({
        ...storeLayout,
        [name]: parseInt(value, 10) || 1,
    })
  }
  
  const handleEntranceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const coord = name === 'entranceX' ? 'entranceX' : 'entranceY';
      const newFloors = storeLayout.floors.map(f => 
        f.floorNumber === currentFloor ? { ...f, [coord]: parseInt(value, 10) || 0 } : f
      );
      onUpdateLayout({ ...storeLayout, floors: newFloors });
  }

  const handleAddFloor = () => {
    const existingFloorNumbers = storeLayout.floors.map(f => f.floorNumber);
    const newFloorNumber = existingFloorNumbers.length > 0 ? Math.max(...existingFloorNumbers) + 1 : 1;
    const newFloor: FloorLayout = { floorNumber: newFloorNumber, aisles: [], entranceX: storeLayout.storeWidth / 2, entranceY: storeLayout.storeHeight - 10 };
    onUpdateLayout({ ...storeLayout, floors: [...storeLayout.floors, newFloor] });
    setCurrentFloor(newFloorNumber);
  };

  const handleDeleteFloor = (floorNumber: number) => {
    if (storeLayout.floors.length <= 1) {
        alert("You cannot delete the last floor.");
        return;
    }
    if (window.confirm(t.confirmDeleteFloor)) {
      const newFloors = storeLayout.floors.filter(f => f.floorNumber !== floorNumber);
      onUpdateLayout({ ...storeLayout, floors: newFloors });
      setCurrentFloor(newFloors[0]?.floorNumber || 1);
    }
  };
  
  const handleAddAisleClick = () => {
    setEditingAisle(null);
    setAisleForm(emptyAisle);
    setIsModalOpen(true);
  };

  const handleEditAisleClick = (aisle: Aisle) => {
    setEditingAisle(aisle);
    setAisleForm(aisle);
    setIsModalOpen(true);
  };
  
  const handleDeleteAisle = (aisleId: number) => {
    if (window.confirm(t.confirmDeleteAisle) && currentFloorLayout) {
       const newAisles = currentFloorLayout.aisles.filter(a => a.id !== aisleId);
       const newFloors = storeLayout.floors.map(f => f.floorNumber === currentFloor ? { ...f, aisles: newAisles } : f);
       onUpdateLayout({ ...storeLayout, floors: newFloors });

      if (selectedAisleId === aisleId) {
        setSelectedAisleId(null);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAisle(null);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (['x', 'y', 'width', 'height', 'shelves'].includes(name)) {
        setAisleForm(prev => ({...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
        setAisleForm(prev => ({...prev, [name]: value}));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFloorLayout) return;

    let newAisles;
    if (editingAisle) {
        newAisles = currentFloorLayout.aisles.map(a => a.id === editingAisle.id ? aisleForm as Aisle : a);
    } else {
        const newAisle = { ...aisleForm as Omit<Aisle, 'id'>, id: Date.now() };
        newAisles = [...currentFloorLayout.aisles, newAisle];
    }
    const newFloors = storeLayout.floors.map(f => f.floorNumber === currentFloor ? { ...f, aisles: newAisles } : f);
    onUpdateLayout({ ...storeLayout, floors: newFloors });
    closeModal();
  };

  const handleAisleMouseDown = (e: React.MouseEvent<SVGGElement>, aisle: Aisle) => {
    e.preventDefault();
    setDraggingAisleId(aisle.id);
    setIsDraggingEntrance(false);
    setSelectedAisleId(aisle.id);
    const svgPoint = getSVGPoint(e.clientX, e.clientY, e.currentTarget.ownerSVGElement!);
    dragOffset.current = {
      x: svgPoint.x - aisle.x,
      y: svgPoint.y - aisle.y
    };
  };

  const handleEntranceMouseDown = (e: React.MouseEvent<SVGGElement>) => {
    e.preventDefault();
    setIsDraggingEntrance(true);
    setDraggingAisleId(null);
    setSelectedAisleId(null);
    const svgPoint = getSVGPoint(e.clientX, e.clientY, e.currentTarget.ownerSVGElement!);
    if (!currentFloorLayout) return;
    dragOffset.current = {
      x: svgPoint.x - currentFloorLayout.entranceX,
      y: svgPoint.y - currentFloorLayout.entranceY
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((draggingAisleId === null && !isDraggingEntrance) || !currentFloorLayout) return;
    e.preventDefault();
    const svgPoint = getSVGPoint(e.clientX, e.clientY, e.currentTarget);
    
    if (isDraggingEntrance) {
        let newX = svgPoint.x - dragOffset.current.x;
        let newY = svgPoint.y - dragOffset.current.y;
        
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
        
        newX = Math.max(0, Math.min(newX, storeLayout.storeWidth));
        newY = Math.max(0, Math.min(newY, storeLayout.storeHeight));

        const updatedFloors = storeLayout.floors.map(f => 
          f.floorNumber === currentFloor ? { ...f, entranceX: newX, entranceY: newY } : f
        );
        onUpdateLayout({ ...storeLayout, floors: updatedFloors });

    } else if (draggingAisleId !== null) {
        const aisle = currentFloorLayout.aisles.find(a => a.id === draggingAisleId);
        if (!aisle) return;

        let newX = svgPoint.x - dragOffset.current.x;
        let newY = svgPoint.y - dragOffset.current.y;
        
        newX = Math.round(newX / 10) * 10;
        newY = Math.round(newY / 10) * 10;
        
        newX = Math.max(0, Math.min(newX, storeLayout.storeWidth - aisle.width));
        newY = Math.max(0, Math.min(newY, storeLayout.storeHeight - aisle.height));

        const updatedAisles = currentFloorLayout.aisles.map(a => 
          a.id === draggingAisleId ? { ...a, x: newX, y: newY } : a
        );
        const newFloors = storeLayout.floors.map(f => f.floorNumber === currentFloor ? { ...f, aisles: updatedAisles } : f);
        onUpdateLayout({ ...storeLayout, floors: newFloors });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    setDraggingAisleId(null);
    setIsDraggingEntrance(false);
  };
  
  const getSVGPoint = (clientX: number, clientY: number, svg: SVGSVGElement) => {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svg.getScreenCTM()!.inverse());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-fit">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t.layoutConfiguration}</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <label htmlFor="storeWidth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.storeWidth}</label>
                <input type="number" id="storeWidth" name="storeWidth" value={storeLayout.storeWidth} onChange={handleDimensionChange} min="100" step="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
            </div>
            <div>
                <label htmlFor="storeHeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.storeHeight}</label>
                <input type="number" id="storeHeight" name="storeHeight" value={storeLayout.storeHeight} onChange={handleDimensionChange} min="100" step="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
            </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-xl font-bold mb-4">{t.manageFloors}</h3>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {storeLayout.floors.map(floor => (
                    <button 
                        key={floor.floorNumber} 
                        onClick={() => setCurrentFloor(floor.floorNumber)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentFloor === floor.floorNumber
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                    >
                        {t.floor} {floor.floorNumber}
                    </button>
                ))}
                <button onClick={handleAddFloor} className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors" aria-label={t.addFloor}><PlusIcon /></button>
            </div>
             {currentFloorLayout && (
                <button onClick={() => handleDeleteFloor(currentFloorLayout.floorNumber)} className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors">
                    {t.deleteFloor} {currentFloorLayout.floorNumber}
                </button>
            )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <h3 className="text-xl font-bold mb-4">{t.entrancePosition}</h3>
            {currentFloorLayout && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="entranceX" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.entranceX}</label>
                        <input type="number" id="entranceX" name="entranceX" value={currentFloorLayout.entranceX} onChange={handleEntranceChange} step="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="entranceY" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t.entranceY}</label>
                        <input type="number" id="entranceY" name="entranceY" value={currentFloorLayout.entranceY} onChange={handleEntranceChange} step="10" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                </div>
            )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">{t.aisles} ({t.floor} {currentFloor})</h3>
                <button onClick={handleAddAisleClick} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors">
                    <PlusIcon /> <span className="ml-2">{t.addAisle}</span>
                </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {currentFloorLayout?.aisles.map(aisle => (
                    <div key={aisle.id} 
                        onMouseEnter={() => setSelectedAisleId(aisle.id)}
                        onMouseLeave={() => setSelectedAisleId(null)}
                        className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition-colors ${selectedAisleId === aisle.id ? 'bg-primary-100 dark:bg-primary-900' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                        <div>
                            <p className="font-semibold">{aisle.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                            {aisle.orientation === 'vertical' ? t.vertical : t.horizontal} - {aisle.width}x{aisle.height} @ ({aisle.x},{aisle.y})
                            </p>
                        </div>
                        <div className="flex space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); handleEditAisleClick(aisle); }} className="text-primary-600 dark:text-primary-400"><EditIcon /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteAisle(aisle.id); }} className="text-red-600 dark:text-red-400"><DeleteIcon /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t.layoutPreview} - {t.floor} {currentFloor}</h2>
        {currentFloorLayout ? (
            <StoreMapView 
                location={null} 
                layout={{...storeLayout, ...currentFloorLayout}}
                t={t} 
                selectedAisleId={selectedAisleId}
                draggingAisleId={draggingAisleId}
                isDraggingEntrance={isDraggingEntrance}
                onAisleMouseDown={handleAisleMouseDown}
                onEntranceMouseDown={handleEntranceMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                Select a floor to begin editing.
            </div>
        )}
      </div>
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{editingAisle ? t.editAisle : t.addAisle}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                  <label className="block text-sm font-medium">{t.aisleName}</label>
                  <input type="text" name="name" value={aisleForm.name} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium">{t.orientation}</label>
                   <select name="orientation" value={aisleForm.orientation} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600">
                        <option value="vertical">{t.vertical}</option>
                        <option value="horizontal">{t.horizontal}</option>
                   </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">{t.shelves}</label>
                    <input type="number" name="shelves" value={aisleForm.shelves} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium">{t.positionX}</label>
                    <input type="number" name="x" value={aisleForm.x} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t.positionY}</label>
                    <input type="number" name="y" value={aisleForm.y} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium">{t.width}</label>
                    <input type="number" name="width" value={aisleForm.width} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">{t.height}</label>
                    <input type="number" name="height" value={aisleForm.height} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="10" />
                  </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={closeModal} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-colors">{t.cancel}</button>
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLayoutManagement;