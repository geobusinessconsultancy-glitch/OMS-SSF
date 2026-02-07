
export enum OrderStatus {
  PAID_ADVANCE = 'Paid Advance',
  FULLY_PAID = 'Fully Paid',
  READY_DELIVERED = 'Ready to Deliver',
  ORDER_COMPLETED = 'Order Completed Successfully',
  CANCEL_REFUNDED = 'Refunded'
}

export interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isComboItem?: boolean;
  isComboHeader?: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  mobile: string;
  address: string;
  pincode: string;
  attendant: string;
  attendantPhone: string;
  bookingDate: string;
  expectedDelivery: string;
  items: OrderItem[];
  total: number;
  advance: number;
  balance: number;
  status: OrderStatus;
  notes: string;
  createdAt: string;
}

export type View = 'DASHBOARD' | 'NEW_ORDER' | 'ORDER_LIST';
