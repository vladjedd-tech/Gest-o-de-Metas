import { useState, useEffect } from 'react';
import { AppData, Category } from '../types';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'Geral', color: '#6366f1', status: 'active' }
];

const STORAGE_KEY = 'metasmart_data';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing local storage', e);
      }
    }
    return {
      sales: [],
      goals: [],
      categories: INITIAL_CATEGORIES,
      workingDays: {},
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const addSale = (sale: Omit<AppData['sales'][0], 'id'>) => {
    setData(prev => ({
      ...prev,
      sales: [...prev.sales, { ...sale, id: crypto.randomUUID() }]
    }));
  };

  const deleteSale = (id: string) => {
    setData(prev => ({
      ...prev,
      sales: prev.sales.filter(s => s.id !== id)
    }));
  };

  const updateGoal = (goal: AppData['goals'][0]) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === goal.id ? goal : g)
    }));
  };

  const addGoal = (goal: Omit<AppData['goals'][0], 'id'>) => {
    setData(prev => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: crypto.randomUUID() }]
    }));
  };

  const deleteGoal = (id: string) => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.filter(g => g.id !== id)
    }));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: crypto.randomUUID() }]
    }));
  };

  const updateCategory = (category: Category) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === category.id ? category : c)
    }));
  };

  const deleteCategory = (id: string) => {
    if (id === 'all') return; // Cannot delete 'Geral'
    setData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id),
      sales: prev.sales.map(s => s.categoryId === id ? { ...s, categoryId: 'all' } : s),
      goals: prev.goals.map(g => g.categoryId === id ? { ...g, categoryId: 'all' } : g)
    }));
  };

  const toggleWorkingDay = (date: string) => {
    setData(prev => ({
      ...prev,
      workingDays: {
        ...prev.workingDays,
        [date]: prev.workingDays[date] === false ? true : false
      }
    }));
  };

  return {
    data,
    addSale,
    deleteSale,
    addGoal,
    updateGoal,
    deleteGoal,
    addCategory,
    updateCategory,
    deleteCategory,
    toggleWorkingDay
  };
}
