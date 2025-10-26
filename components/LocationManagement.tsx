import React, { useState, useMemo, useEffect } from 'react';
import type { Location, Translations, StoreLayout } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icon';

interface LocationManagementProps {
  locations: Location[];
  storeLayout: StoreLayout;
  onAddLocation: (location: Omit<Location, 'id'>) => void;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (locationId: number) => void;
  t: Translations;
}

const LocationManagement: React.FC<LocationManagementProps> = ({
  locations,
  storeLayout,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  t
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState<Location | null>(null);
  
  const initialFloor = storeLayout.floors[0]?.floorNumber || 1;
  const initialAisles = storeLayout.floors[0]?.aisles || [];
  
  const emptyLocationForm: Omit<Location, 'id'> = {
    floor: initialFloor,
    aisleId: initialAisles[0]?.id || 0,
    shelf: 1,
    bin: 1,
  };

  const [locationForm, setLocationForm] = useState<Omit<Location, 'id'> | Location>(emptyLocationForm);
  
  const allAisles = useMemo(() => storeLayout.floors.flatMap(f => f.aisles), [storeLayout]);
  const availableAislesForForm = useMemo(() => {
    const floorData = storeLayout.floors.find(f => f.floorNumber === locationForm.floor);
    return floorData ? floorData.aisles : [];
  }, [storeLayout, locationForm.floor]);

  useEffect(() => {
    // When the available aisles for the selected floor change,
    // check if the currently selected aisleId is still valid.
    // If not, default to the first available aisle.
    if (availableAislesForForm.length > 0 && !availableAislesForForm.some(a => a.id === locationForm.aisleId)) {
        setLocationForm(prev => ({ ...prev, aisleId: availableAislesForForm[0].id }));
    } else if (availableAislesForForm.length === 0) {
        setLocationForm(prev => ({ ...prev, aisleId: 0 }));
    }
  }, [availableAislesForForm, locationForm.aisleId]);

  const handleAddLocationClick = () => {
    setEditingLocation(null);
    setLocationForm(emptyLocationForm);
    setIsModalOpen(true);
  };

  const handleEditLocationClick = (location: Location) => {
    setEditingLocation(location);
    setLocationForm(location);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (location: Location) => {
    setIsDeleting(location);
  };

  const confirmDelete = () => {
    if (isDeleting) {
      onDeleteLocation(isDeleting.id);
      setIsDeleting(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    setLocationForm(emptyLocationForm);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocationForm(prev => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLocation) {
      onUpdateLocation(locationForm as Location);
    } else {
      onAddLocation(locationForm as Omit<Location, 'id'>);
    }
    closeModal();
  };
  
  const getAisleName = (aisleId: number) => {
    const aisle = allAisles.find(a => a.id === aisleId);
    return aisle ? aisle.name : `ID: ${aisleId}`;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.locationManagement}</h2>
        <button
          onClick={handleAddLocationClick}
          className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <PlusIcon /> <span className="ml-2">{t.addLocation}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">{t.floor}</th>
              <th scope="col" className="px-6 py-3">{t.aisle}</th>
              <th scope="col" className="px-6 py-3">{t.shelf}</th>
              <th scope="col" className="px-6 py-3">{t.bin}</th>
              <th scope="col" className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(loc => (
              <tr key={loc.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="px-6 py-4">{loc.floor}</td>
                <td className="px-6 py-4">{getAisleName(loc.aisleId)}</td>
                <td className="px-6 py-4">{loc.shelf}</td>
                <td className="px-6 py-4">{loc.bin}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEditLocationClick(loc)} className="text-primary-600 dark:text-primary-400 hover:underline mr-4"><EditIcon /></button>
                  <button onClick={() => handleDeleteClick(loc)} className="text-red-600 dark:text-red-400 hover:underline"><DeleteIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingLocation ? t.editLocation : t.addLocation}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-sm font-medium">{t.floor}</label>
                  <select name="floor" value={locationForm.floor || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required>
                    {storeLayout.floors.map(f => (
                        <option key={f.floorNumber} value={f.floorNumber}>{t.floor} {f.floorNumber}</option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label className="block text-sm font-medium">{t.aisle}</label>
                  <select name="aisleId" value={locationForm.aisleId || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required disabled={availableAislesForForm.length === 0}>
                    {availableAislesForForm.length > 0 ? availableAislesForForm.map(aisle => (
                        <option key={aisle.id} value={aisle.id}>{aisle.name}</option>
                    )) : <option>No aisles on this floor</option>}
                  </select>
                </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">{t.shelf}</label>
                  <input type="number" name="shelf" value={locationForm.shelf || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.bin}</label>
                  <input type="number" name="bin" value={locationForm.bin || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
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

      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">{t.deleteLocation}</h3>
            <p className="mb-6">{t.confirmDeleteLocation}</p>
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

export default LocationManagement;
