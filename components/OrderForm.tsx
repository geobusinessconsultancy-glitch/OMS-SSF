
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Order, OrderItem, OrderStatus, Product } from '../types';
import { INVENTORY, CATEGORIES } from '../constants';
import { Plus, Trash2, Search, User, CreditCard, ChevronRight, Package, Store, Sparkles, Box, RefreshCcw, UserCheck, Star } from 'lucide-react';

interface OrderFormProps {
  onSubmit: (order: Order) => void;
  onCancel: () => void;
  initialData?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [attendant, setAttendant] = useState('');
  const [attendantPhone, setAttendantPhone] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [advance, setAdvance] = useState(0);
  const [notes, setNotes] = useState('');
  
  const [manualTotal, setManualTotal] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  const totalInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setMobile(initialData.mobile);
      setAddress(initialData.address);
      setPincode(initialData.pincode);
      setAttendant(initialData.attendant);
      setAttendantPhone(initialData.attendantPhone);
      setBookingDate(initialData.bookingDate);
      setExpectedDelivery(initialData.expectedDelivery);
      setSelectedItems(initialData.items);
      setAdvance(initialData.advance);
      setNotes(initialData.notes);
      setManualTotal(initialData.total);
    }
  }, [initialData]);

  const hasComboHeader = useMemo(() => selectedItems.some(i => i.isComboHeader), [selectedItems]);

  const filteredProducts = useMemo(() => {
    return INVENTORY.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const calculatedTotal = useMemo(() => 
    selectedItems.reduce((sum, item) => sum + (item.isComboItem ? 0 : item.price * item.quantity), 0), 
  [selectedItems]);

  const total = manualTotal !== null ? manualTotal : calculatedTotal;
  const balance = total - advance;

  // Items sorted: Combo headers at top, followed by items
  const sortedItems = useMemo(() => {
    return [...selectedItems].sort((a, b) => {
      if (a.isComboHeader && !b.isComboHeader) return -1;
      if (!a.isComboHeader && b.isComboHeader) return 1;
      return 0;
    });
  }, [selectedItems]);

  const addItem = (product: Product) => {
    const existing = selectedItems.find(i => i.id === product.id);
    if (existing) {
      setSelectedItems(prev => prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      // If a combo is present, new inventory items are added with price 0 by default (as they are part of package)
      const price = hasComboHeader ? 0 : product.price;
      const isComboItem = hasComboHeader;
      
      setSelectedItems(prev => [...prev, { 
        id: product.id, 
        name: product.name.toUpperCase(), 
        price, 
        quantity: 1, 
        isComboItem,
        isComboHeader: false
      }]);
    }
  };

  const addCombo = () => {
    const comboId = `combo-${Date.now()}`;
    setSelectedItems(prev => [
      { 
        id: comboId, 
        name: "📦 COMBO: ENTER PACKAGE NAME", 
        price: 0, 
        quantity: 1,
        isComboItem: false,
        isComboHeader: true
      },
      ...prev
    ]);
    
    // Switch to manual total if it's a combo, because usually the package has a fixed price
    if (manualTotal === null) setManualTotal(calculatedTotal);
    
    setTimeout(() => {
      totalInputRef.current?.focus();
      totalInputRef.current?.select();
    }, 100);
  };

  const addOtherItem = () => {
    setSelectedItems(prev => [...prev, { 
      id: `custom-${Date.now()}`, 
      name: "CUSTOM FURNITURE ITEM", 
      price: 0, 
      quantity: 1,
      isComboItem: hasComboHeader,
      isComboHeader: false
    }]);
  };

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const updateItemPrice = (id: string, newPrice: number) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, price: newPrice } : i));
  };

  const updateItemName = (id: string, newName: string) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, name: newName.toUpperCase() } : i));
  };

  const toggleComboItem = (id: string) => {
    setSelectedItems(prev => prev.map(i => i.id === id ? { ...i, isComboItem: !i.isComboItem } : i));
  };

  const resetTotal = () => setManualTotal(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      alert("Please select items before placing an order.");
      return;
    }

    const order: Order = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      orderNumber: initialData?.orderNumber || `SS-${Date.now().toString().slice(-6)}`,
      customerName,
      mobile,
      address,
      pincode,
      attendant,
      attendantPhone,
      bookingDate,
      expectedDelivery,
      items: sortedItems,
      total,
      advance,
      balance,
      status: initialData?.status || OrderStatus.PAID_ADVANCE,
      notes,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };
    onSubmit(order);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            {initialData ? 'Modify Booking' : 'New Booking Registration'}
          </h2>
          <p className="text-blue-600 font-bold text-xs uppercase tracking-[0.4em] mt-2">Sri Senthur Furniture Erode</p>
        </div>
        <div className="flex gap-4">
            <button onClick={onCancel} className="px-8 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-all">Cancel</button>
            <button form="order-form" type="submit" className="px-12 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-4 text-sm uppercase active:scale-95">
                {initialData ? 'Save Changes' : 'Confirm Order'} <ChevronRight size={24} />
            </button>
        </div>
      </div>

      <form id="order-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-7 space-y-10">
          
          <section className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-wrap items-center justify-between gap-6 border-4 border-slate-800">
            <div className="flex flex-col">
              <span className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Package Actions</span>
              <h3 className="text-white text-xl font-black uppercase">Cart Modifiers</h3>
            </div>
            <div className="flex gap-4">
              <button 
                  type="button" 
                  onClick={addCombo}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-900/20 active:scale-95 font-black text-xs uppercase tracking-widest"
              >
                  <Package size={20} /> ADD COMBO HEADER
              </button>
              <button 
                  type="button" 
                  onClick={addOtherItem}
                  className="bg-white/10 text-white px-8 py-4 rounded-2xl hover:bg-white/20 transition-all flex items-center gap-3 border border-white/10 active:scale-95 font-black text-xs uppercase tracking-widest"
              >
                  <Plus size={20} /> CUSTOM ITEM
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-10">
            <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-4">
                <User size={20} className="opacity-50" /> Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <FormField label="Customer Name *" value={customerName} onChange={setCustomerName} required placeholder="NAME" />
                <FormField label="Mobile Number *" value={mobile} onChange={setMobile} required placeholder="PHONE" />
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1">Delivery Site Address *</label>
                  <textarea 
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ENTER FULL ADDRESS..."
                      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none min-h-[120px] font-bold text-slate-800 uppercase text-[13px] shadow-inner"
                  />
                </div>
                <FormField label="Pincode *" value={pincode} onChange={setPincode} required placeholder="PINCODE" />
                <FormField label="Expected Delivery Date *" type="date" value={expectedDelivery} onChange={setExpectedDelivery} required />
              </div>
            </section>

            <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-4">
                <UserCheck size={20} className="opacity-50" /> Sales Logistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                 <FormField label="Sales Attendant Name *" value={attendant} onChange={setAttendant} required placeholder="SALES PERSON NAME" />
                 <FormField label="Attendant Phone *" value={attendantPhone} onChange={setAttendantPhone} required placeholder="PHONE" />
                 <FormField label="Booking Date" type="date" value={bookingDate} onChange={setBookingDate} />
              </div>
            </section>
          </div>

          <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-4 mb-10">
              <Store size={20} className="opacity-50" /> Furniture Inventory
            </h3>
            <div className="space-y-10">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="relative flex-1">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
                  <input 
                    type="text" 
                    placeholder="Search catalog items..." 
                    className="w-full pl-16 pr-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none font-black text-slate-800 placeholder:opacity-30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="px-8 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-slate-700 uppercase text-xs outline-none shadow-inner"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-2 pr-6 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredProducts.map(product => (
                  <div 
                    key={product.id} 
                    className="p-6 border-2 border-slate-50 rounded-[2rem] hover:border-blue-300 hover:bg-blue-50/20 cursor-pointer transition-all flex items-center justify-between group bg-white shadow-sm"
                    onClick={() => addItem(product)}
                  >
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 opacity-40">{product.category}</p>
                      <h4 className="font-black text-slate-900 text-base truncate uppercase leading-none tracking-tight">{product.name}</h4>
                      <p className="text-slate-900 font-black text-xl mt-3 tracking-tighter">₹{product.price.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 bg-slate-50 flex items-center justify-center rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                      <Plus size={24} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* WIDER Cart Sidebar */}
        <div className="xl:col-span-5 space-y-10">
          <div className="bg-blue-600 text-white p-8 md:p-10 rounded-[3rem] shadow-2xl sticky top-24 border-4 border-blue-500">
            <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
              <CreditCard className="text-blue-200" /> Current Cart
            </h3>
            
            <div className="space-y-4 mb-10 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-blue-400">
              {selectedItems.length === 0 ? (
                <div className="text-center py-24 border-4 border-dashed border-blue-500 rounded-[2.5rem] text-blue-200 font-black uppercase text-[11px] tracking-[0.3em] opacity-30">
                  Cart is empty
                </div>
              ) : (
                sortedItems.map(item => (
                  <div key={item.id} className={`p-6 rounded-3xl border-2 transition-all ${
                    item.isComboHeader ? 'bg-white border-white shadow-2xl scale-[1.02] z-10' : 
                    item.isComboItem ? 'bg-white/5 border-white/5 opacity-80' : 
                    'bg-white/10 border-white/10 hover:bg-white/15 shadow-xl'
                  }`}>
                    <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                           <input 
                              className={`bg-transparent border-none p-0 font-black text-[15px] w-full focus:ring-0 outline-none uppercase placeholder:text-blue-300 tracking-tight ${item.isComboHeader ? 'text-slate-900' : 'text-white'}`}
                              value={item.name}
                              onChange={(e) => updateItemName(item.id, e.target.value)}
                              placeholder="ITEM NAME"
                           />
                           {item.isComboHeader && <span className="text-[10px] font-black text-blue-600 uppercase block mt-2 tracking-widest flex items-center gap-1"><Star size={10} fill="currentColor" /> Main Package Header</span>}
                           {item.isComboItem && !item.isComboHeader && <span className="text-[9px] font-black text-emerald-300 uppercase block mt-2 tracking-widest italic decoration-2 underline underline-offset-4">Package Item</span>}
                        </div>
                        <div className="flex items-center gap-3">
                            {!item.isComboHeader && (
                              <button 
                                type="button" 
                                onClick={() => toggleComboItem(item.id)}
                                className={`p-2 rounded-xl transition-all ${item.isComboItem ? 'bg-emerald-500 shadow-xl' : 'bg-white/10 text-white/40 hover:text-white'}`}
                                title="Set as Included/Excluded"
                              >
                                  <Box size={16} />
                              </button>
                            )}
                            <button type="button" onClick={() => removeItem(item.id)} className={`${item.isComboHeader ? 'text-rose-600 bg-rose-50' : 'text-rose-300 bg-white/5'} hover:text-rose-500 p-2 rounded-xl transition-all`}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                        <div className={`flex items-center rounded-xl overflow-hidden border shadow-inner shrink-0 ${item.isComboHeader ? 'bg-slate-100 border-slate-200' : 'bg-white/10 border-white/10'}`}>
                            <button type="button" onClick={() => updateQuantity(item.id, -1)} className={`px-4 py-2 font-black text-lg hover:bg-black/5 ${item.isComboHeader ? 'text-slate-900' : 'text-white'}`}>-</button>
                            <span className={`px-5 py-2 text-sm font-black border-x ${item.isComboHeader ? 'text-slate-900 border-slate-200' : 'text-white border-white/10 bg-white/5'}`}>{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.id, 1)} className={`px-4 py-2 font-black text-lg hover:bg-black/5 ${item.isComboHeader ? 'text-slate-900' : 'text-white'}`}>+</button>
                        </div>
                        
                        <div className="flex-1 relative min-w-[140px]">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-[12px] font-black ${item.isComboHeader ? 'text-blue-600' : 'text-blue-300'}`}>₹</span>
                            <input 
                                type="number" 
                                className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base font-black text-right outline-none transition-all shadow-inner ${
                                  item.isComboHeader ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                                  'bg-white/10 border-white/10 text-white focus:bg-white/20'
                                }`}
                                value={item.price || ''}
                                onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="h-px bg-white/20 my-10" />

            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest">Final Order Total *</label>
                  {manualTotal !== null && (
                    <button type="button" onClick={resetTotal} className="text-[10px] font-black bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 flex items-center gap-3 transition-all border border-white/10">
                      <RefreshCcw size={14} /> AUTO SUM
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 font-black text-3xl">₹</span>
                  <input 
                    ref={totalInputRef}
                    type="number" 
                    className="w-full pl-14 pr-8 py-7 bg-white border-4 border-transparent rounded-[2rem] focus:border-blue-300 outline-none font-black text-5xl text-blue-600 shadow-2xl transition-all"
                    value={total || ''}
                    onChange={(e) => setManualTotal(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-black text-blue-200 uppercase tracking-widest px-1">Advance Received *</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-300 font-black text-3xl">₹</span>
                  <input 
                    type="number" 
                    className="w-full pl-14 pr-8 py-6 bg-white/10 border-2 border-white/20 rounded-[2rem] focus:border-white focus:bg-white focus:text-blue-600 outline-none font-black text-4xl text-white transition-all shadow-inner"
                    value={advance || ''}
                    onChange={(e) => setAdvance(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="bg-slate-900/40 p-8 rounded-[2.5rem] border-2 border-white/10 flex justify-between items-center text-white shadow-2xl backdrop-blur-md">
                  <span className="text-[11px] font-black uppercase tracking-widest opacity-60">Balance Due</span>
                  <span className="text-4xl font-black text-amber-300 tracking-tighter">₹{balance.toLocaleString()}</span>
              </div>
            </div>

            <div className="mt-10">
              <label className="text-[11px] font-black text-blue-200 uppercase mb-4 block px-1 tracking-widest">Manufacturing / Color Notes</label>
              <textarea 
                className="w-full px-6 py-5 bg-white/10 border border-white/10 rounded-3xl outline-none text-[13px] text-white placeholder:text-blue-300 min-h-[100px] font-bold uppercase shadow-inner"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="DETAILS: WOOD TYPE, FABRIC, MEASUREMENTS..."
              />
            </div>

            <button 
              type="submit"
              className="w-full mt-12 bg-white text-blue-600 py-7 rounded-[2rem] font-black shadow-2xl hover:bg-blue-50 transition-all flex items-center justify-center gap-5 text-2xl uppercase tracking-tighter active:scale-[0.98] disabled:opacity-50"
              disabled={selectedItems.length === 0}
            >
              <Sparkles size={28} /> CONFIRM BOOKING
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const FormField: React.FC<{ label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string; placeholder?: string }> = ({ label, value, onChange, required, type = "text", placeholder }) => (
  <div className="space-y-3">
    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">{label}</label>
    <input 
      type={type}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-blue-500 outline-none font-black text-slate-900 transition-all focus:bg-white uppercase text-[14px] shadow-sm placeholder:opacity-20"
    />
  </div>
);

export default OrderForm;
