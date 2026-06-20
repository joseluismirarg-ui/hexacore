import React from 'react';
import { Calendar } from 'lucide-react';

export type DateRangeOption = 'today' | 'yesterday' | 'last3days' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime';

interface DateRangeFilterProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
      <div className="flex items-center pl-3 pr-2 text-gray-400">
        <Calendar className="h-4 w-4" />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as DateRangeOption)}
        className="bg-transparent text-sm text-gray-200 outline-none pr-3 py-1.5 focus:ring-0 border-none cursor-pointer appearance-none"
      >
        <option value="today" className="bg-gray-800">Hoy</option>
        <option value="yesterday" className="bg-gray-800">Ayer</option>
        <option value="last3days" className="bg-gray-800">Últimos 3 días</option>
        <option value="last7days" className="bg-gray-800">Última semana</option>
        <option value="thisMonth" className="bg-gray-800">Este mes</option>
        <option value="lastMonth" className="bg-gray-800">Mes anterior</option>
        <option value="thisYear" className="bg-gray-800">Este año</option>
        <option value="lastYear" className="bg-gray-800">Año anterior</option>
        <option value="allTime" className="bg-gray-800">Todo el tiempo</option>
      </select>
    </div>
  );
};
