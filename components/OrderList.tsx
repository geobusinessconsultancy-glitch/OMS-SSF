
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus } from '../types';
import { Search, Printer, Edit3, Phone, MapPin, MessageSquare, Filter, ChevronDown } from 'lucide-react';

interface OrderListProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onPrint: (order: Order) => void;
  onEdit: (order: Order) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onUpdateStatus, onPrint, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.mobile.includes(searchTerm) ||
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const shareOnWhatsApp = (order: Order) => {
    const message = `*SRI SENTHUR FURNITURE*\n\n*Order Summary for ${order.customerName}*\nBill No: ${order.orderNumber}\n\nTotal Bill: ₹${order.total.toLocaleString()}\nPaid Adv: ₹${order.advance.toLocaleString()}\nDue Bal: ₹${order.balance.toLocaleString()}\n\nDelivery Expected: ${new Date(order.expectedDelivery).toLocaleDateString()}\n\nThank you for choosing Sri Senthur!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${order.mobile}?text=${encodedMessage}`, '_blank');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID_ADVANCE: return 'bg-blue-600';
      case OrderStatus.FULLY_PAID: return 'bg-emerald-600';
      case OrderStatus.READY_DELIVERED: return 'bg-amber-600';
      case OrderStatus.ORDER_COMPLETED: return 'bg-indigo-600';
      case OrderStatus.CANCEL_REFUNDED: return 'bg-rose-600';
      default: return 'bg-slate-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Booking Ledger</h2>
            <p className="text-blue-600 font-bold text-sm tracking-widest uppercase">Viewing {filteredOrders.length} of {orders.length} orders</p>
          </div>
          <div className="relative w-full lg:w-[450px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by customer, mobile, or bill ID..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-700 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-50 pt-6">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mr-4">
            <Filter size={14} /> Filter By Status:
          </div>
          <FilterTab 
            label="All Bookings" 
            active={statusFilter === 'ALL'} 
            onClick={() => setStatusFilter('ALL')} 
            count={orders.length}
          />
          {Object.values(OrderStatus).map(status => (
            <FilterTab 
              key={status} 
              label={status} 
              active={statusFilter === status} 
              onClick={() => setStatusFilter(status)} 
              count={orders.filter(o => o.status === status).length}
              color={getStatusColor(status)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-24 text-center rounded-[2rem] shadow-sm border border-slate-100 text-slate-300">
            <p className="text-2xl font-black italic">No bookings found for the selected criteria.</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col xl:flex-row xl:items-center gap-10 group hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
              
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black text-white px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg ${getStatusColor(order.status)}`}>
                    {order.orderNumber}
                  </span>
                  <span className="text-slate-400 text-xs font-black italic tracking-wider">{new Date(order.bookingDate).toLocaleDateString()}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-900 uppercase leading-none">
                  {order.customerName}
                </h3>
                <div className="flex flex-wrap gap-6 text-sm font-black text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-slate-400"><Phone size={16} className="text-blue-500" /> {order.mobile}</span>
                  <span className="flex items-center gap-2 text-slate-400"><MapPin size={16} className="text-blue-500" /> PIN: {order.pincode}</span>
                </div>
              </div>

              <div className="xl:w-64 space-y-2 bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner group-hover:bg-white transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Payment Status</p>
                <div className="flex justify-between items-center text-slate-400 font-bold text-sm">
                  <span>BILL TOTAL:</span>
                  <span className="text-slate-900">₹{order.total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-600 font-black text-sm">
                  <span>ADVANCE:</span>
                  <span>₹{order.advance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 font-black text-lg pt-1 border-t border-slate-200 mt-2">
                  <span>PENDING:</span>
                  <span>₹{order.balance.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row xl:flex-col items-center gap-3 xl:w-64">
                <div className="relative w-full">
                  <select 
                    className={`w-full appearance-none px-6 py-4 rounded-2xl text-[11px] font-black border-2 outline-none transition-all cursor-pointer pr-12 ${
                      order.status === OrderStatus.ORDER_COMPLETED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      order.status === OrderStatus.CANCEL_REFUNDED ? 'bg-rose-50 text-rose-700 border-rose-100' :
                      'bg-blue-50 text-blue-800 border-blue-100 hover:border-blue-400'
                    }`}
                    value={order.status}
                    onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                  >
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status}>{status.toUpperCase()}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
                <div className="flex items-center gap-2 w-full">
                  <button 
                    onClick={() => onPrint(order)}
                    className="flex-1 bg-slate-900 text-white px-4 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                  >
                    <Printer size={16} /> Print Bill
                  </button>
                  <button 
                    onClick={() => shareOnWhatsApp(order)}
                    className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    title="Send WhatsApp Update"
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                    onClick={() => onEdit(order)}
                    className="p-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const FilterTab: React.FC<{ label: string; active: boolean; onClick: () => void; count: number; color?: string }> = ({ label, active, onClick, count, color }) => (
  <button
    onClick={onClick}
    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-3 border-2 ${
      active 
        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
    }`}
  >
    {color && <div className={`w-2 h-2 rounded-full ${color}`} />}
    {label}
    <span className={`px-2 py-0.5 rounded-md text-[9px] ${active ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400'}`}>
      {count}
    </span>
  </button>
);

export default OrderList;
