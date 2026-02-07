
import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, View } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell
} from 'recharts';
import { 
  CheckCircle2, Clock, Truck, Ban, Wallet, TrendingUp, Table, Calendar, Filter
} from 'lucide-react';

interface DashboardProps {
  orders: Order[];
  setView: (v: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ orders, setView }) => {
  // Date Range State
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  // Filtered Orders based on date range
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const bookingDate = o.bookingDate;
      return bookingDate >= startDate && bookingDate <= endDate;
    });
  }, [orders, startDate, endDate]);

  const stats = useMemo(() => {
    const counts = {
      advance: 0,
      fullyPaid: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
    };

    let totalRevenue = 0;
    let totalReceived = 0;

    filteredOrders.forEach(o => {
      // Counters
      if (o.status === OrderStatus.PAID_ADVANCE) counts.advance++;
      else if (o.status === OrderStatus.FULLY_PAID) counts.fullyPaid++;
      else if (o.status === OrderStatus.READY_DELIVERED) counts.delivered++;
      else if (o.status === OrderStatus.ORDER_COMPLETED) counts.completed++;
      else if (o.status === OrderStatus.CANCEL_REFUNDED) counts.cancelled++;

      // Financials
      if (o.status !== OrderStatus.CANCEL_REFUNDED) {
        totalRevenue += o.total;
        // Rely on the actual 'advance' field which tracks collected cash
        totalReceived += o.advance;
      }
    });

    return {
      ...counts,
      totalRevenue,
      totalReceived,
      receivables: Math.max(0, totalRevenue - totalReceived)
    };
  }, [filteredOrders]);

  const statusChartData = useMemo(() => [
    { name: 'Advance', value: stats.advance, color: '#3b82f6' },
    { name: 'Fully Paid', value: stats.fullyPaid, color: '#10b981' },
    { name: 'Ready', value: stats.delivered, color: '#f59e0b' },
    { name: 'Completed', value: stats.completed, color: '#6366f1' },
    { name: 'Cancelled', value: stats.cancelled, color: '#ef4444' },
  ], [stats]);

  const monthlyReport = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; bookings: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    filteredOrders.forEach(o => {
      const date = new Date(o.bookingDate);
      const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      if (!months[key]) {
        months[key] = { month: key, revenue: 0, bookings: 0 };
      }
      if (o.status !== OrderStatus.CANCEL_REFUNDED) {
        months[key].revenue += o.total;
      }
      months[key].bookings += 1;
    });

    return Object.values(months).sort((a, b) => {
        return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
  }, [filteredOrders]);

  const exportToSpreadsheet = () => {
    const headers = ["Order No", "Date", "Customer", "Mobile", "Total", "Advance", "Balance", "Status", "Attendant"];
    const rows = filteredOrders.map(o => [
      o.orderNumber,
      o.bookingDate,
      o.customerName,
      o.mobile,
      o.total,
      o.advance,
      o.balance,
      o.status,
      o.attendant
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sri_Senthur_Report_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Business Analytics</h2>
          <p className="text-slate-400 font-bold text-xs tracking-[0.3em] uppercase">Operations Insights & Ledger Feed</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 px-3">
              <Calendar size={16} className="text-blue-600" />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none outline-none font-black text-[11px] text-slate-700 uppercase"
              />
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-3 px-3">
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none outline-none font-black text-[11px] text-slate-700 uppercase"
              />
            </div>
          </div>

          <button 
            onClick={exportToSpreadsheet}
            className="bg-white border-2 border-slate-100 text-slate-900 px-6 py-4 rounded-2xl font-black shadow-sm transition-all flex items-center gap-3 hover:bg-slate-50 active:scale-95 text-[11px] uppercase tracking-widest"
          >
            <Table size={18} className="text-emerald-600" />
            EXPORT CSV
          </button>
          
          <button 
            onClick={() => setView('NEW_ORDER')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center gap-3 group active:scale-95 text-[11px] uppercase tracking-widest"
          >
            <TrendingUp size={18} />
            NEW BOOKING
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard title="Paid Advance" value={stats.advance} icon={<Clock className="text-blue-600" />} color="border-blue-200" />
        <StatCard title="Fully Paid" value={stats.fullyPaid} icon={<Wallet className="text-emerald-600" />} color="border-emerald-200" />
        <StatCard title="Ready to Deliver" value={stats.delivered} icon={<Truck className="text-amber-600" />} color="border-amber-200" />
        <StatCard title="Success Orders" value={stats.completed} icon={<CheckCircle2 className="text-indigo-600" />} color="border-indigo-200" />
        <StatCard title="Cancelled" value={stats.cancelled} icon={<Ban className="text-rose-600" />} color="border-rose-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Report Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <Filter size={16} /> REVENUE BY PERIOD
              </h3>
              <div className="text-[10px] font-black bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full uppercase tracking-widest">
                {monthlyReport.length} Data Points
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              {monthlyReport.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReport}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '16px' }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[12, 12, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-50 rounded-[2rem]">
                  <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No data for selected range</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10">BOOKING VOLUME TREND</h3>
            <div className="h-[250px] w-full">
              {monthlyReport.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyReport}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)', fontWeight: 'bold', padding: '16px' }}
                    />
                    <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={6} dot={{ r: 8, fill: '#10b981', strokeWidth: 4, stroke: '#fff' }} activeDot={{ r: 10 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border-4 border-dashed border-slate-50 rounded-[2rem]">
                  <p className="text-slate-300 font-black uppercase text-xs tracking-widest">No data for selected range</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial & Status Summary */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden relative border-4 border-slate-800">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black mb-10 opacity-40 uppercase tracking-[0.4em]">Financial Summary</h3>
              <div className="space-y-12">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">Net Sales Portfolio</p>
                  <h4 className="text-5xl font-black tracking-tighter text-blue-400">₹{stats.totalRevenue.toLocaleString()}</h4>
                </div>
                <div className="h-px bg-slate-800/50" />
                <div className="grid grid-cols-1 gap-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Cash Inflow</p>
                      <h4 className="text-2xl font-black text-emerald-400">₹{stats.totalReceived.toLocaleString()}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                       <TrendingUp size={20} className="text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Receivables</p>
                      <h4 className="text-2xl font-black text-amber-400">₹{stats.receivables.toLocaleString()}</h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                       <Clock size={20} className="text-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20" />
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
             <h3 className="text-[11px] font-black mb-10 text-slate-400 uppercase tracking-[0.3em]">Live Feed Status Breakdown</h3>
             <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                        width={80}
                    />
                    <Tooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                        {statusChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-8 space-y-3">
                {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest border-b border-slate-50 pb-2 last:border-0">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-500">{item.name}</span>
                        </div>
                        <span className="text-slate-900">{item.value} Units</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-white p-8 rounded-[2rem] shadow-sm border-b-8 ${color} hover:translate-y-[-6px] transition-all duration-500`}>
    <div className="flex items-center justify-between mb-6">
      <div className="p-4 bg-slate-50 rounded-2xl shadow-inner">{icon}</div>
      <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{value}</span>
    </div>
    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
  </div>
);

export default Dashboard;
