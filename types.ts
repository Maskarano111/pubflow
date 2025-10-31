
export type MenuItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  img: string;
  stock?: number;
  description?: string;
};

export type CartItem = MenuItem & {
  quantity: number;
};

export enum OrderStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Ready = 'Ready',
  Served = 'Served',
  Delivered = 'Delivered', // For Waiter App
}

export type OrderItem = {
  id: string;
  name:string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  table: number;
  items: OrderItem[];
  total: number;
  payment: 'Cash' | 'Mobile Money';
  status: OrderStatus;
  createdAt: any;
  notes?: string;
  staffId?: string;
  staffName?: string;
};

export type StaffRole = 'superadmin' | 'admin' | 'counter' | 'waiter';

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  createdAt: any;
  active?: boolean;
};

export type AppSettings = {
  taxRate: number; // e.g., 0.05 for 5%
  paymentMethods: {
    cash: boolean;
    mobileMoney: boolean;
  };
};
