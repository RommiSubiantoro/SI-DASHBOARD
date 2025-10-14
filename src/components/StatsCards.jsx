import React from 'react';
import { BarChart3, Target, TrendingUp } from 'lucide-react';


const StatsCards = ({
  totalRevenue,
  totalExpenses,
  totalAct2025,
  avgTarget,
  labels = {
    revenue: "Total ACT 2024",
    expenses: "Total BDGT 2025",
    act2025: "Total ACT 2025",
    avgTarget: "Avg Target"
  }
}) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID').format(value);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
       {/* Act 2025 */}
      <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{labels.act2025}</p>
            <p className="text-xl font-semibold text-gray-800">
              Rp {formatCurrency(totalAct2025)}
            </p>
          </div>
          <Target className="text-red-500" size={32} />
        </div>
      </div>
      
      {/* Expenses */}
      <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{labels.expenses}</p>
            <p className="text-xl font-semibold text-gray-800">
              Rp {formatCurrency(totalExpenses)}
            </p>
          </div>
          <BarChart3 className="text-blue-500" size={32} />
        </div>
      </div>

      {/* Average Target */}
      <div className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{labels.avgTarget}</p>
            <p className="text-xl font-semibold text-gray-800">
              Rp {formatCurrency(avgTarget)}
            </p>
          </div>
          <TrendingUp className="text-purple-500" size={32} />
        </div>
      </div>
    </div>

  );
};

export default StatsCards;