
import React, { useState, useEffect } from 'react';
import { View, Order, OrderStatus } from './types';
import Dashboard from './components/Dashboard';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import PrintPreview from './components/PrintPreview';
import { LayoutDashboard, FilePlus, ListOrdered, Store, ShieldCheck, X } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<View>('DASHBOARD');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderForPrint, setSelectedOrderForPrint] = useState<Order | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('sri_senthur_orders');
    if (saved) {
      try {
        setOrders(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse orders", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sri_senthur_orders', JSON.stringify(orders));
  }, [orders]);

  const handleCreateOrder = (order: Order) => {
    if (orderToEdit) {
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
      setOrderToEdit(null);
    } else {
      setOrders(prev => [order, ...prev]);
    }
    setView('ORDER_LIST');
  };

  const handleUpdateStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        let newAdvance = o.advance;
        let newBalance = o.balance;

        // Automatically update financial values based on status transitions
        if (status === OrderStatus.FULLY_PAID || 
            status === OrderStatus.READY_DELIVERED || 
            status === OrderStatus.ORDER_COMPLETED) {
          newAdvance = o.total;
          newBalance = 0;
        } else if (status === OrderStatus.PAID_ADVANCE && o.status !== OrderStatus.PAID_ADVANCE) {
          // If moving back to Advance, we don't know original advance easily without state history, 
          // but usually this is a correction. We'll keep the current advance but allow edit via form.
          // For now, let's keep it as is.
        }

        return { ...o, status, advance: newAdvance, balance: newBalance };
      }
      return o;
    }));
  };

  const handlePrint = (order: Order) => {
    setSelectedOrderForPrint(order);
  };

  const handleEdit = (order: Order) => {
    setOrderToEdit(order);
    setView('NEW_ORDER');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 relative">
      {/* Top Navigation Bar */}
      <header className="no-print w-full bg-blue-600 text-white shadow-lg z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-inner">
               <Store className="text-blue-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase leading-none">Sri Senthur</h1>
              <p className="text-[10px] font-bold opacity-80 tracking-widest uppercase">Furniture OMS</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-2">
            <NavBtn active={view === 'DASHBOARD'} onClick={() => { setView('DASHBOARD'); setOrderToEdit(null); }} icon={<LayoutDashboard size={18} />} label="Dashboard" />
            <NavBtn active={view === 'NEW_ORDER' && !orderToEdit} onClick={() => { setView('NEW_ORDER'); setOrderToEdit(null); }} icon={<FilePlus size={18} />} label="New Order" />
            <NavBtn active={view === 'ORDER_LIST'} onClick={() => { setView('ORDER_LIST'); setOrderToEdit(null); }} icon={<ListOrdered size={18} />} label="All Orders" />
          </nav>

          <div className="flex items-center gap-4 text-right">
             <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase opacity-60">System Status</p>
                <p className="text-xs font-bold text-emerald-300">Live & Syncing</p>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-print">
        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
          {view === 'DASHBOARD' && <Dashboard orders={orders} setView={setView} />}
          {view === 'NEW_ORDER' && <OrderForm onSubmit={handleCreateOrder} initialData={orderToEdit} onCancel={() => setView('DASHBOARD')} />}
          {view === 'ORDER_LIST' && <OrderList orders={orders} onUpdateStatus={handleUpdateStatus} onPrint={handlePrint} onEdit={handleEdit} />}
        </div>
      </main>

      {/* Bottom Footer Credit */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-400">
           <div className="flex items-center gap-4">
              <span>© 2026 Sri Senthur Furniture</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-blue-500 font-bold">Erode, TN</span>
           </div>
           <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-slate-300" />
              <span>Developed by <span className="text-slate-900">Geobusiness Consultancy</span></span>
           </div>
        </div>
      </footer>

      {/* Print Preview Modal */}
      {selectedOrderForPrint && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex justify-center overflow-y-auto p-4 md:p-10">
            <div className="relative w-full max-w-[210mm] shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                <button 
                  onClick={() => setSelectedOrderForPrint(null)}
                  className="no-print fixed top-6 right-6 bg-rose-600 text-white p-4 rounded-full shadow-2xl z-[110] hover:bg-rose-700 transition-all active:scale-95"
                  title="Close Preview"
                >
                  <X size={24} strokeWidth={3} />
                </button>
                <PrintPreview order={selectedOrderForPrint} />
            </div>
        </div>
      )}

      {/* Actual Print View (Hidden on Screen) */}
      <div className="print-only">
        {selectedOrderForPrint && <PrintPreview order={selectedOrderForPrint} />}
      </div>
    </div>
  );
};

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold text-sm ${active ? 'bg-white text-blue-600 shadow-lg' : 'hover:bg-blue-500 text-blue-100'}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default App;

