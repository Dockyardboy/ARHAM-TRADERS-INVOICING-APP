import React, { useState } from 'react';
import { Item, Party, Expense, PaymentMethod } from '../types';
import { X, Check, Package, Users, Receipt } from 'lucide-react';

// ==========================================
// 1. ADD ITEM MODAL
// ==========================================
interface AddItemModalProps {
  currency: string;
  onSave: (item: Item) => void;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ currency, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState(`SKU-${Math.floor(100 + Math.random() * 900)}`);
  const [sellingPrice, setSellingPrice] = useState<number>(500);
  const [purchasePrice, setPurchasePrice] = useState<number>(350);
  const [stockQty, setStockQty] = useState<number>(50);
  const [lowStockAlert, setLowStockAlert] = useState<number>(10);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [unit, setUnit] = useState<string>('PCS');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: Item = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      sellingPrice: Number(sellingPrice) || 0,
      purchasePrice: Number(purchasePrice) || 0,
      stockQty: Number(stockQty) || 0,
      lowStockAlert: Number(lowStockAlert) || 0,
      taxRate: Number(taxRate) || 0,
      unit: unit.trim().toUpperCase() || 'PCS'
    };

    onSave(newItem);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Add New Inventory Item</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Item / Product Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. 24-inch IPS Monitor"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm focus:bg-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">SKU / Code</label>
              <input
                type="text"
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Measurement Unit</label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-bold"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="LTR">LTR (Liters)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="PKT">PKT (Packets)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Selling Price ({currency})</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={sellingPrice}
                onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-sm font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Purchase Price ({currency})</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={purchasePrice}
                onChange={e => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-sm font-bold text-slate-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-600 mb-1" title="Initial opening items">Opening Stock</label>
              <input
                type="number"
                min="0"
                required
                value={stockQty}
                onChange={e => setStockQty(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold text-red-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1" title="Trigger yellow badge">Low Alert Min</label>
              <input
                type="number"
                min="0"
                required
                value={lowStockAlert}
                onChange={e => setLowStockAlert(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">GST % Optional</label>
              <select
                value={taxRate}
                onChange={e => setTaxRate(parseInt(e.target.value) || 0)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold"
              >
                <option value="0">No GST</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Save Item Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. ADD PARTY MODAL
// ==========================================
interface AddPartyModalProps {
  currency: string;
  onSave: (party: Party) => void;
  onClose: () => void;
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({ currency, onSave, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'customer' | 'supplier'>('customer');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);
  const [balanceDirection, setBalanceDirection] = useState<'receive' | 'pay'>('receive');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Calculate signed balance
    // positive means customer owes us money (Receivable)
    // negative means we owe money to supplier (Payable)
    let initialVal = Math.abs(Number(openingBalance) || 0);
    if (balanceDirection === 'pay') {
      initialVal = -initialVal;
    }

    const newParty: Party = {
      id: `p-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || 'N/A',
      email: email.trim() || 'N/A',
      gstin: gstin.trim().toUpperCase() || '',
      address: address.trim() || 'No address provided',
      type,
      openingBalance: initialVal,
      currentBalance: initialVal
    };

    onSave(newParty);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Add New Ledger Party</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 text-xs">
          
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Party Group Type</label>
            <div className="flex rounded shadow-sm border border-slate-300 overflow-hidden text-center">
              <button
                type="button"
                onClick={() => { setType('customer'); setBalanceDirection('receive'); }}
                className={`flex-1 py-1.5 font-bold text-xs cursor-pointer ${type === 'customer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                👤 Customer (Client)
              </button>
              <button
                type="button"
                onClick={() => { setType('supplier'); setBalanceDirection('pay'); }}
                className={`flex-1 py-1.5 font-bold text-xs cursor-pointer ${type === 'supplier' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                🏢 Supplier (Vendor)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Party / Business Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Lakshmi Enterprises"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Mobile / Phone</label>
              <input
                type="text"
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="contact@party.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Business ID / Reference Number</label>
            <input
              type="text"
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={gstin}
              onChange={e => setGstin(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 font-mono uppercase text-xs font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Billing Address</label>
            <textarea
              rows={2}
              placeholder="Street name, landmark, City, State, PIN"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs"
            />
          </div>

          {/* Opening Balance setup */}
          <div className="bg-slate-50 p-3 rounded border border-slate-200">
            <label className="block font-bold text-slate-700 mb-1">Initial Opening Balance Amount</label>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-slate-400 font-bold">{currency}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={openingBalance === 0 ? '' : openingBalance}
                onChange={e => setOpeningBalance(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-2/3 bg-white border border-slate-300 rounded p-1 text-xs font-bold text-slate-900"
              />
              
              <select
                value={balanceDirection}
                onChange={e => setBalanceDirection(e.target.value as any)}
                className="w-1/3 bg-white border border-slate-300 rounded p-1 text-[11px] font-bold"
              >
                <option value="receive">🟢 To Receive (+)</option>
                <option value="pay">🔴 To Pay (-)</option>
              </select>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Select "To Receive" if they have an unpaid past due to you. Select "To Pay" if you owe them.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Create Party Account</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. ADD EXPENSE MODAL
// ==========================================
interface AddExpenseModalProps {
  currency: string;
  onSave: (expense: Expense) => void;
  onClose: () => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ currency, onSave, onClose }) => {
  const [category, setCategory] = useState('Office Maintenance');
  const [amount, setAmount] = useState<number>(500);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [paidVia, setPaidVia] = useState<PaymentMethod>('cash');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      category: category.trim() || 'General Overhead',
      amount: Number(amount) || 0,
      date,
      description: description.trim() || 'No remarks logged',
      paidVia
    };

    onSave(newExp);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base">Record Business Expense</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 text-xs">
          
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">Expense Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm font-bold text-slate-900"
            >
              <option value="Office Maintenance">🏢 Office Maintenance & Rent</option>
              <option value="Internet & Telecom">📶 Internet & Telephone</option>
              <option value="Staff Refreshments">☕ Staff Refreshments & Tea</option>
              <option value="Travel & Transport">🚕 Travel, Petrol & Delivery</option>
              <option value="Stationery & Printing">🖨️ Stationery, Packing & Printing</option>
              <option value="Advertising & Promos">📢 Marketing & Advertisements</option>
              <option value="Electricity & Utilities">⚡ Electricity & Utility Bills</option>
              <option value="Miscellaneous Overhead">🔧 Miscellaneous / Other Overheads</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Expense Amount ({currency}) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-red-300 rounded p-2 text-base font-bold text-red-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Paid From / Asset Wallet</label>
            <select
              value={paidVia}
              onChange={e => setPaidVia(e.target.value as PaymentMethod)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-1.5 text-xs uppercase font-bold"
            >
              <option value="cash">💵 Hand Cash Drawer</option>
              <option value="upi">📱 UPI App Transfer</option>
              <option value="bank">🏦 Bank Direct Debit</option>
              <option value="card">💳 Office Card Swipe</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Detailed Description & Voucher Memo</label>
            <textarea
              rows={3}
              placeholder="e.g. Paid to vendor for fiber replacement cable, receipt #421"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer text-xs"
            >
              <Check className="w-4 h-4" />
              <span>Log Expense Outflow</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
