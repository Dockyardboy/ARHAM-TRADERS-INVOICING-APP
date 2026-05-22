import { BusinessProfile, Party, Item, Invoice, Expense } from './types';

export const initialBusinessProfile: BusinessProfile = {
  name: "Arham Traders Invoicing App",
  tagline: "Billing, Ledger, Inventory and Accounting",
  logoUrl: "/arham-logo.svg",
  phone: "+91 98765 43210",
  email: "billing@arhamtraders.in",
  gstin: "29ABCDE1234F1Z5",
  address: "Main Market Road, Wholesale Trading Hub, India",
  currency: "₹",
  upiId: "arhamtraders@okaxis",
  bankAccount: "50100432198765",
  ifscCode: "HDFC0001234",
  termsAndConditions: "1. Goods once sold will not be taken back.\n2. Interest @ 18% p.a. will be charged if payment is delayed beyond the due date.\n3. Subject to Bangalore jurisdiction only."
};

export const initialParties: Party[] = [
  {
    id: "p-1",
    name: "TechZone Infotech Pvt Ltd",
    phone: "9845011223",
    email: "accounts@techzone.com",
    gstin: "29KJHGF9876E1Z2",
    address: "MG Road, 4th Block, Bangalore",
    type: "customer",
    openingBalance: 15000,
    currentBalance: 24500
  },
  {
    id: "p-2",
    name: "Sharma Hardware & Electricals",
    phone: "9123456780",
    email: "sharma.stores@gmail.com",
    gstin: "27POIUY5432W1Z8",
    address: "Station Road, Hubli",
    type: "customer",
    openingBalance: 0,
    currentBalance: 8400
  },
  {
    id: "p-3",
    name: "Global Electronic Suppliers",
    phone: "022-87654321",
    email: "sales@globalelec.in",
    gstin: "27QWERT1234A1Z9",
    address: "Lamington Road, Mumbai",
    type: "supplier",
    openingBalance: -12000,
    currentBalance: -35000
  },
  {
    id: "p-4",
    name: "Venkateswara Supermart",
    phone: "9440012345",
    email: "venkat.mart@yahoo.co.in",
    gstin: "36ZXCVB6789S1Z4",
    address: "Ameerpet, Hyderabad",
    type: "customer",
    openingBalance: 5000,
    currentBalance: 0
  },
  {
    id: "p-5",
    name: "Pinnacle Paper & Packaging",
    phone: "9811122334",
    email: "orders@pinnaclepack.com",
    gstin: "07MNBVC4321R1Z1",
    address: "Okhla Phase 1, New Delhi",
    type: "supplier",
    openingBalance: -4000,
    currentBalance: -4000
  }
];

export const initialItems: Item[] = [
  {
    id: "item-1",
    name: "Logi Wireless Ergonomic Mouse",
    sku: "MS-WIR-01",
    sellingPrice: 850,
    purchasePrice: 600,
    stockQty: 48,
    lowStockAlert: 10,
    taxRate: 18,
    unit: "PCS"
  },
  {
    id: "item-2",
    name: "Ultra HD HDMI Cable 2 Meters",
    sku: "CBL-HD-02",
    sellingPrice: 350,
    purchasePrice: 180,
    stockQty: 8, // Low stock alert!
    lowStockAlert: 15,
    taxRate: 12,
    unit: "PCS"
  },
  {
    id: "item-3",
    name: "Mechanical Gaming Keyboard RGB",
    sku: "KB-MECH-05",
    sellingPrice: 2400,
    purchasePrice: 1800,
    stockQty: 35,
    lowStockAlert: 5,
    taxRate: 18,
    unit: "PCS"
  },
  {
    id: "item-4",
    name: "Premium Thermal Paper Rolls (Pack of 10)",
    sku: "PAP-TH-10",
    sellingPrice: 450,
    purchasePrice: 320,
    stockQty: 2, // Low stock alert!
    lowStockAlert: 20,
    taxRate: 5,
    unit: "BOX"
  },
  {
    id: "item-5",
    name: "High-Speed USB-C Hub 7-in-1",
    sku: "HUB-UC-07",
    sellingPrice: 1650,
    purchasePrice: 1200,
    stockQty: 65,
    lowStockAlert: 12,
    taxRate: 18,
    unit: "PCS"
  },
  {
    id: "item-6",
    name: "Heavy Duty Cardboard Packing Cartons",
    sku: "BOX-CRD-LG",
    sellingPrice: 45,
    purchasePrice: 30,
    stockQty: 120,
    lowStockAlert: 50,
    taxRate: 12,
    unit: "PCS"
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: "inv-101",
    invoiceNo: "SALE-2026-001",
    type: "sale",
    partyId: "p-1",
    partyName: "TechZone Infotech Pvt Ltd",
    date: "2026-05-10",
    dueDate: "2026-05-25",
    items: [
      {
        id: "l-1",
        itemId: "item-1",
        itemName: "Logi Wireless Ergonomic Mouse",
        qty: 10,
        unitPrice: 850,
        taxRate: 18,
        discountPercent: 5,
        total: 8075
      },
      {
        id: "l-2",
        itemId: "item-3",
        itemName: "Mechanical Gaming Keyboard RGB",
        qty: 5,
        unitPrice: 2400,
        taxRate: 18,
        discountPercent: 0,
        total: 12000
      }
    ],
    subtotal: 20075,
    totalDiscount: 425,
    totalTax: 3613.5,
    shippingCharges: 150,
    grandTotal: 23838.5,
    amountPaid: 23838.5,
    paymentStatus: "paid",
    paymentMethod: "bank",
    notes: "Delivered immediately via express local courier."
  },
  {
    id: "inv-102",
    invoiceNo: "SALE-2026-002",
    type: "sale",
    partyId: "p-2",
    partyName: "Sharma Hardware & Electricals",
    date: "2026-05-12",
    dueDate: "2026-05-27",
    items: [
      {
        id: "l-3",
        itemId: "item-2",
        itemName: "Ultra HD HDMI Cable 2 Meters",
        qty: 20,
        unitPrice: 350,
        taxRate: 12,
        discountPercent: 10,
        total: 6300
      },
      {
        id: "l-4",
        itemId: "item-4",
        itemName: "Premium Thermal Paper Rolls (Pack of 10)",
        qty: 4,
        unitPrice: 450,
        taxRate: 5,
        discountPercent: 0,
        total: 1800
      }
    ],
    subtotal: 8100,
    totalDiscount: 700,
    totalTax: 846,
    shippingCharges: 50,
    grandTotal: 8996,
    amountPaid: 4000,
    paymentStatus: "partial",
    paymentMethod: "upi",
    notes: "Balance promised next week upon second batch arrival."
  },
  {
    id: "inv-103",
    invoiceNo: "PUR-2026-001",
    type: "purchase",
    partyId: "p-3",
    partyName: "Global Electronic Suppliers",
    date: "2026-05-01",
    dueDate: "2026-05-15",
    items: [
      {
        id: "l-5",
        itemId: "item-5",
        itemName: "High-Speed USB-C Hub 7-in-1",
        qty: 50,
        unitPrice: 1200,
        taxRate: 18,
        discountPercent: 0,
        total: 60000
      }
    ],
    subtotal: 60000,
    totalDiscount: 0,
    totalTax: 10800,
    shippingCharges: 500,
    grandTotal: 71300,
    amountPaid: 36300,
    paymentStatus: "partial",
    paymentMethod: "bank",
    notes: "Stock intake order #GS-9901"
  },
  {
    id: "inv-104",
    invoiceNo: "SALE-2026-003",
    type: "sale",
    partyId: "p-4",
    partyName: "Venkateswara Supermart",
    date: "2026-05-14",
    dueDate: "2026-05-29",
    items: [
      {
        id: "l-6",
        itemId: "item-6",
        itemName: "Heavy Duty Cardboard Packing Cartons",
        qty: 50,
        unitPrice: 45,
        taxRate: 12,
        discountPercent: 0,
        total: 2250
      }
    ],
    subtotal: 2250,
    totalDiscount: 0,
    totalTax: 270,
    shippingCharges: 0,
    grandTotal: 2520,
    amountPaid: 0,
    paymentStatus: "unpaid",
    paymentMethod: "credit",
    notes: "Regular monthly dispatch."
  },
  {
    id: "inv-105",
    invoiceNo: "SALE-2026-004",
    type: "sale",
    partyId: "p-1",
    partyName: "TechZone Infotech Pvt Ltd",
    date: "2026-05-16",
    dueDate: "2026-05-30",
    items: [
      {
        id: "l-7",
        itemId: "item-5",
        itemName: "High-Speed USB-C Hub 7-in-1",
        qty: 6,
        unitPrice: 1650,
        taxRate: 0,
        discountPercent: 0,
        total: 9900
      }
    ],
    subtotal: 9900,
    totalDiscount: 0,
    totalTax: 0,
    shippingCharges: 100,
    grandTotal: 10000,
    amountPaid: 5000,
    paymentStatus: "partial",
    paymentMethod: "upi",
    notes: "Custom order with partial advance received."
  }
];

export const initialExpenses: Expense[] = [
  {
    id: "exp-1",
    category: "Office Rent",
    amount: 12000,
    date: "2026-05-01",
    description: "Monthly maintenance and space rental",
    paidVia: "bank"
  },
  {
    id: "exp-2",
    category: "Internet & Telecom",
    amount: 1499,
    date: "2026-05-03",
    description: "Broadband fiber line quarterly recharge",
    paidVia: "upi"
  },
  {
    id: "exp-3",
    category: "Staff Refreshments",
    amount: 850,
    date: "2026-05-11",
    description: "Tea, snacks, and water cans for employees",
    paidVia: "cash"
  }
];

