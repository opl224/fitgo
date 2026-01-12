import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  large?: boolean;
  highlight?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, unit, large = false, highlight = false }) => {
  if (large) {
    return (
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</span>
        <div className={`flex items-baseline ${highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
          <span className="text-4xl font-bold tracking-tight">{value}</span>
          {unit && <span className="ml-1 text-lg font-medium text-gray-500 dark:text-gray-400">{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 flex flex-col justify-center transition-colors">
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</span>
      <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 break-all">{value}</span>
      {unit && <span className="text-xs text-gray-500 dark:text-gray-400">{unit}</span>}
    </div>
  );
};