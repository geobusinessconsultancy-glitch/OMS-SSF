import React, { useRef } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import { Printer } from 'lucide-react';
import templateJpg from './template.jpg';

interface PrintPreviewProps {
  order: Order;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ order }) => {
  const printRef = useRef<HTMLDivElement>(null);
  
  // CONFIGURATION FOR A4 PAGE
  const ITEMS_PAGE_1 = 12; 
  const ITEMS_OTHER_PAGES = 14; 

  // 🔴 PASTE YOUR BASE64 STRING HERE
  const TEMPLATE_BASE64 = templateJpg;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  };

  const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const numStr = Math.floor(num).toString();
    if (numStr.length > 9) return 'Overflow';
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (parseInt(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
    str += (parseInt(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
    str += (parseInt(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
    str += (parseInt(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
    str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
    return str.trim() ? str.trim() : 'Zero';
  };

  const getStatusSealConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PAID_ADVANCE: return { label: 'ADVANCE RECEIVED', color: 'border-blue-700 text-blue-800' };
      case OrderStatus.FULLY_PAID: return { label: 'FULLY PAID', color: 'border-emerald-700 text-emerald-800' };
      case OrderStatus.READY_DELIVERED: return { label: 'READY TO DELIVER', color: 'border-amber-700 text-amber-800' };
      case OrderStatus.ORDER_COMPLETED: return { label: 'SUCCESSFULLY COMPLETED', color: 'border-indigo-700 text-indigo-800' };
      case OrderStatus.CANCEL_REFUNDED: return { label: 'REFUNDED / CANCELLED', color: 'border-rose-700 text-rose-800' };
      default: return { label: 'OFFICIAL', color: 'border-slate-700 text-slate-800' };
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert("Please allow popups to print");
        return;
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map(style => style.outerHTML)
        .join('');
    const content = printRef.current.innerHTML;

    // A small fix to resolve issues with browsers dropping print content
    const cleanContent = content.replace(/backdrop-blur-sm|bg-white\/85|bg-white\/90|opacity-80/g, 'print-safe-class');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Bill - ${order.orderNumber}</title>
          ${styles}
          <style>
            @page { size: A4; margin: 0; }
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: sans-serif; }
            ::-webkit-scrollbar { display: none; }
            
            /* Print Specific Overrides to guarantee visibility */
            @media print {
              .print-safe-class { background-color: transparent !important; opacity: 1 !important; backdrop-filter: none !important; }
              table { background-color: transparent !important; }
              tr { background-color: transparent !important; }
              th { background-color: #0f172a !important; color: white !important; } /* slate-900 */
              .seal-texture { /* remove opacity on seal to ensure printing */ opacity: 1 !important; }
            }
          </style>
        </head>
        <body>
          ${cleanContent}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const chunkedItems: OrderItem[][] = [];
  let currentItemIdx = 0;
  
  chunkedItems.push(order.items.slice(0, ITEMS_PAGE_1));
  currentItemIdx = ITEMS_PAGE_1;

  while (currentItemIdx < order.items.length) {
    chunkedItems.push(order.items.slice(currentItemIdx, currentItemIdx + ITEMS_OTHER_PAGES));
    currentItemIdx += ITEMS_OTHER_PAGES;
  }
  if (chunkedItems.length === 0) chunkedItems.push([]);

  const seal = getStatusSealConfig(order.status);

  return (
    <div className="flex flex-col items-center w-full bg-white">
      
      <div className="mb-8 flex flex-wrap justify-center gap-4 no-print w-full max-w-[210mm] pt-4 px-4">
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-black transition-all shadow-xl uppercase tracking-widest text-sm"
        >
          <Printer size={20} /> PRINT IN NEW TAB
        </button>
      </div>

      <div ref={printRef} className="flex flex-col w-full items-center">
        {chunkedItems.map((pageItems, pageIdx) => {
          const isLastPage = pageIdx === chunkedItems.length - 1;
          
          return (
            <div 
              key={pageIdx} 
              className="bg-white relative a4-page overflow-hidden print:m-0"
              style={{ width: '210mm', height: '297mm', position: 'relative', pageBreakAfter: 'always' }}
            >
              
              {/* BACKGROUND IMAGE - Applied to ALL pages */}
              {TEMPLATE_BASE64 && (
                <img 
                  src={TEMPLATE_BASE64} 
                  alt="" 
                  className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
                  style={{ printColorAdjust: 'exact' }}
                />
              )}

              {/* HEADER SPACER - Applied to ALL pages (50mm) */}
              <div className="relative z-10" style={{ height: '50mm', minHeight: '50mm', width: '100%' }}></div>

              <div 
                className="relative z-10"
                style={{ 
                  padding: '0 15mm 15mm 15mm', 
                  display: 'flex', 
                  flexDirection: 'column',
                  height: 'calc(297mm - 50mm)', 
                  boxSizing: 'border-box'
                }}
              >
                {/* Header Info */}
                <div className="flex justify-between items-end mb-4 border-b-2 border-slate-900 pb-1 shrink-0">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">ORDER ESTIMATE / வரி மதிப்பீடு</h2>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">EST No: <span className="text-slate-900">{order.orderNumber}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Booking Date</p>
                    <span className="text-base font-black text-slate-900 leading-none">{formatDate(order.bookingDate)}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-8 mb-4 text-[11px] shrink-0">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer / வாடிக்கையாளர்:</span>
                      <span className="text-xl font-black text-slate-900 uppercase leading-none truncate">{order.customerName}</span>
                      <span className="text-sm font-black text-blue-800">MOBILE: {order.mobile}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Address / முகவரி:</span>
                      <p className="font-bold leading-tight text-slate-800 uppercase text-[10px] line-clamp-2">{order.address}</p>
                      <p className="font-black text-slate-900 text-[10px]">PIN: {order.pincode}</p>
                    </div>
                  </div>
                  <div className="space-y-2 pl-6 border-l-2 border-slate-100">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-1">
                      <span className="font-bold text-slate-400 uppercase text-[8px] tracking-widest">Exp. Delivery</span>
                      <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-[10px]">{formatDate(order.expectedDelivery)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 pt-1">
                      <span className="font-bold text-slate-400 uppercase text-[8px] tracking-widest">Sales Person</span>
                      <span className="font-black uppercase text-slate-900 text-xs leading-none">{order.attendant}</span>
                      <span className="font-black text-blue-700 text-[10px]">{order.attendantPhone}</span>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border-[1.5px] border-slate-900 rounded-sm overflow-hidden mb-4 shrink-0 bg-transparent relative z-20">
                  <table className="w-full text-[11px] table-fixed">
                    <thead>
                      <tr className="text-white">
                        <th className="p-1.5 w-10 text-center font-black uppercase text-[7px] bg-slate-900">S.No</th>
                        <th className="p-1.5 text-left font-black uppercase text-[7px] bg-slate-900">Description / விவரம்</th>
                        <th className="p-1.5 w-16 text-center font-black uppercase text-[7px] bg-slate-900">Qty</th>
                        <th className="p-1.5 w-28 text-right font-black uppercase text-[7px] bg-slate-900">Rate (₹)</th>
                        <th className="p-1.5 w-28 text-right font-black uppercase text-[7px] bg-slate-900">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((item, idx) => {
                        let globalIdx = idx + 1;
                        if (pageIdx > 0) {
                          globalIdx = ITEMS_PAGE_1 + ((pageIdx - 1) * ITEMS_OTHER_PAGES) + idx + 1;
                        }
                        return (
                          <tr key={item.id} className="border-b border-slate-100 font-bold h-[28px] bg-white/90 print:bg-white">
                            <td className="p-1 text-center text-slate-400 font-black text-[9px]">{globalIdx}</td>
                            <td className="p-1 uppercase text-slate-800 font-black tracking-tight truncate text-[10px]">{item.name}</td>
                            <td className="p-1 text-center text-slate-900 font-black">{item.quantity}</td>
                            <td className="p-1 text-right text-slate-800">
                              {item.isComboItem ? <span className="text-[6px] font-black text-emerald-600 italic uppercase">Included</span> : item.price.toLocaleString()}
                            </td>
                            <td className="p-1 text-right font-black text-slate-900">
                              {item.isComboItem ? '--' : (item.price * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Content - ONLY on the last page */}
                {isLastPage && (
                  <div className="mt-auto">
                    <div className="grid grid-cols-12 gap-6 items-start">
                      <div className="col-span-7 space-y-3">
                        <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                          <h4 className="text-[8px] font-black text-blue-800 uppercase tracking-widest mb-1">நிபந்தனைகள் (Manufacturing Notes)</h4>
                          <p className="text-[10px] font-bold text-slate-600 leading-tight italic">
                            {order.notes ? order.notes : 'ஷோரூம் தரத்திற்கு ஏற்ப உயர்தர வேலைப்பாடுகளுடன் பொருட்கள் தயாரிக்கப்படும். பாதுகாப்பான கையாளுதல் மற்றும் பேக்கிங் இதில் அடங்கும்.'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[8px] font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5">GENERAL TERMS</h4>
                          <ul className="text-[9px] font-bold text-slate-700 space-y-0.5 uppercase leading-none">
                            <li>• ADVANCE IS REFUNDABLE</li>
                            <li>• FULL PAYMENT REQUIRED BEFORE LOADING</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="col-span-5 space-y-2.5">
                        <div className="bg-white border-[2px] border-slate-900 rounded-lg overflow-hidden shadow-sm">
                          <div className="flex justify-between px-3 py-1.5 border-b border-slate-100">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Bill Total</span>
                            <span className="font-black text-slate-900 text-sm">₹{order.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between px-3 py-1.5 border-b border-slate-100 bg-blue-50/20">
                            <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest italic">Advance Paid</span>
                            <span className="font-black text-blue-800 text-sm">₹{order.advance.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center px-3 py-2 bg-slate-900 text-white">
                            <span className="text-[9px] font-black uppercase tracking-widest">Balance Due</span>
                            <span className="text-lg font-black text-amber-300 leading-none">₹{order.balance.toLocaleString()}</span>
                          </div>
                        </div>
                        <p className="text-[8px] font-black text-slate-600 text-center uppercase leading-tight px-1">
                          Rupees {numberToWords(order.total)} Only
                        </p>
                      </div>
                    </div>

                    <div className={`absolute bottom-[80px] right-[40px] w-32 h-32 rounded-full border-[5px] ${seal.color} flex flex-col items-center justify-center text-center p-1 pointer-events-none select-none z-20 seal-texture`} style={{ transform: 'rotate(-12deg)' }}>
                      <div className={`w-full h-full rounded-full border-[2px] border-dashed ${seal.color} flex flex-col items-center justify-center p-2 bg-white/50 print:bg-transparent`}>
                          <span className="text-[7px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-70">SRI SENTHUR</span>
                          <span className="text-[9px] font-black uppercase leading-tight px-1 py-0.5 border-y-[1.5px] border-current">{seal.label}</span>
                          <span className="text-[6px] font-black mt-0.5 tracking-widest uppercase">ERODE</span>
                      </div>
                    </div>

                    <div className="mt-10 flex justify-between items-end px-4">
                      <div className="text-center w-40">
                        <div className="h-px bg-slate-300 mb-2"></div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Customer Signature</p>
                      </div>
                      <div className="text-center w-56">
                        <p className="text-[9px] font-black text-blue-900 uppercase mb-4 tracking-widest italic leading-none">For SRI SENTHUR FURNITURE</p>
                        <div className="h-px bg-slate-300 mb-2"></div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Authorized Signatory</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintPreview;
