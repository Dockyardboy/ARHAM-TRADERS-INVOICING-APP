export type PartyType = 'customer' | 'supplier';

export interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  type: PartyType;
  openingBalance: number; // positive means receivable from customer, negative means payable
  currentBalance: number;
}

export interface Item {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number;
  purchasePrice: number;
  stockQty: number;
  lowStockAlert: number;
  taxRate: number; // e.g., 0, 5, 12, 18, 28
  unit: string; // e.g., PCS, KG, BOX, LTR
}

export interface InvoiceLineItem {
  id: string;
  itemId: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  taxRate: number;
  discountPercent: number;
  total: number; // after discount, before tax or including tax depending on display
}

export type InvoiceType = 'sale' | 'purchase';
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'upi' | 'bank' | 'card' | 'credit';
export type PaymentDirection = 'in' | 'out';

export interface Invoice {
  id: string;
  invoiceNo: string;
  type: InvoiceType;
  partyId: string;
  partyName: string;
  date: string;
  dueDate: string;
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCharges: number;
  grandTotal: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
  customTitle?: string;
  customTerms?: string;
  customFooter?: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  logoUrl: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  currency: string;
  upiId: string;
  bankAccount: string;
  ifscCode: string;
  termsAndConditions: string;
}

export interface PaymentRecord {
  id: string;
  direction: PaymentDirection;
  partyId: string;
  partyName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes: string;
}

export interface MonthlyMetric {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  paidVia: PaymentMethod;
}
