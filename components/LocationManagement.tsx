import React, { useState } from 'react';
import type { Location, Translations } from '../types';
import { EditIcon, DeleteIcon, PlusIcon } from './common/Icon';

interface LocationManagementProps {
  locations: Location[];
  onAddLocation: (location: Omit<Location, 'id'>) => void;
  onUpdateLocation: (location: Location) => void;
  onDeleteLocation: (locationId: number) => void;
  t: Translations;
}

const LocationManagement: React.FC<LocationManagementProps> = ({
  locations,
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  t
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isDeleting, setIsDeleting] = useState<Location | null>(null);
  
  const emptyLocationForm: Omit<Location, 'id'> = {
    floor: 1,
    aisle: 1,
    shelf: 1,
    bin: 1,
  };

  const [locationForm, setLocationForm] = useState<Omit<Location, 'id'> | Location>(emptyLocationForm);

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

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                <td className="px-6 py-4">{loc.aisle}</td>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">{t.floor}</label>
                  <input type="number" name="floor" value={(locationForm as Location).floor || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.aisle}</label>
                  <input type="number" name="aisle" value={(locationForm as Location).aisle || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.shelf}</label>
                  <input type="number" name="shelf" value={(locationForm as Location).shelf || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium">{t.bin}</label>
                  <input type="number" name="bin" value={(locationForm as Location).bin || 1} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600" required min="1" />
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
