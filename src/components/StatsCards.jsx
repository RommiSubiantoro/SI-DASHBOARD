import React from 'react';
import { BarChart3, Target, TrendingUp } from 'lucide-react';
import "../css/StatsCard.css";

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
    <div className="stats-cards">
      <div className="revenue-stats">
        <div className="body-text">
          <div>
            <p className="textstats-1">{labels.revenue}</p>
            <p className="textstats-2">Rp {formatCurrency(totalRevenue)}</p>
          </div>
          <TrendingUp size={32} />
        </div>
      </div>
      
      <div className="stats-cards-2">
        <div className="body-text-expenses">
          <div>
            <p className="text-expenses1">{labels.expenses}</p>
            <p className="text-expenses2">Rp {formatCurrency(totalExpenses)}</p>
          </div>
          <BarChart3 size={32} />
        </div>
      </div>
      
      <div className="stats-card-profit">
        <div className="stats-card-3">
          <div>
            <p className="text-profit-1">{labels.act2025}</p>
            <p className="text-profit-2">Rp {formatCurrency(totalAct2025)}</p>
          </div>
          <Target size={32} />
        </div>
      </div>
      
      <div className="stats-card-avg">
        <div className="stats-card-4">
          <div>
            <p className="text-avg-1">{labels.avgTarget}</p>
            <p className="text-avg-2">Rp {formatCurrency(avgTarget)}</p>
          </div>
          <TrendingUp size={32} />
        </div>
      </div>
    </div>
  );
};

export default StatsCards;