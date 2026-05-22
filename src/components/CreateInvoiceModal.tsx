import React, { useState } from 'react';
import { Invoice, Item, Party, InvoiceLineItem, InvoiceType, PaymentMethod, PaymentStatus } from '../types';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface CreateInvoiceModalProps {
  items: Item[];
  parties: Party[];
  currency: string;
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  items,
  parties,
  currency,
  onSave,
  onClose
}) => {
  const [type, setType] = useState<InvoiceType>('sale');
  const [partyId, setPartyId] = useState<string>(parties[0]?.id || '');
  const [customPartyName, setCustomPartyName] = useState<string>('');
  
  // Auto reference string generator
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const [invoiceNo, setInvoiceNo] = useState<string>(`INV-2026-${randomSuffix}`);
  
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  
  const [lineItems, setLineItems] = useState<Omit<InvoiceLineItem, 'id'>[]>([
    {
      itemId: items[0]?.id || '',
      itemName: items[0]?.name || 'Custom Product',
      qty: 1,
      unitPrice: items[0]?.sellingPrice || 100,
      taxRate: 0,
      discountPercent: 0,
      total: (items[0]?.sellingPrice || 100) * 1
    }
  ]);

  const [shippingCharges, setShippingCharges] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [notes, setNotes] = useState<string>('Thank you for choosing us!');
  const [customTitle, setCustomTitle] = useState<string>('Invoice');
  const [customTerms, setCustomTerms] = useState<string>('Payment as per agreed terms. Goods supplied as per customer requirement.');
  const [customFooter, setCustomFooter] = useState<string>('Thank you for your business.');
  const [gstEnabled, setGstEnabled] = useState<boolean>(false);

  // Handle line item updates
  const handleItemSelect = (index: number, selectedItemId: string) => {
    const found = items.find(i => i.id === selectedItemId);
    const updated = [...lineItems];
    if (found) {
      const price = type === 'sale' ? found.sellingPrice : found.purchasePrice;
      const totalVal = price * updated[index].qty * (1 - updated[index].discountPercent / 100);
      updated[index] = {
        ...updated[index],
        itemId: found.id,
        itemName: found.name,
        unitPrice: price,
        taxRate: found.taxRate || 18,
        total: totalVal
      };
    } else {
      updated[index].itemId = '';
      updated[index].itemName = 'Generic Item';
    }
    setLineItems(updated);
  };

  const updateLineField = (index: number, field: keyof Omit<InvoiceLineItem, 'id'>, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    
    // Recalculate total for this row
    const numQty = Number(item.qty) || 0;
    const numPrice = Number(item.unitPrice) || 0;
    const numDisc = Number(item.discountPercent) || 0;
    
    const baseVal = numQty * numPrice;
    const discVal = baseVal * (numDisc / 100);
    item.total = baseVal - discVal;
    
    updated[index] = item;
    setLineItems(updated);
  };

  const addLine = () => {
    const firstItem = items[0];
    const price = firstItem ? (type === 'sale' ? firstItem.sellingPrice : firstItem.purchasePrice) : 100;
    setLineItems([
      ...lineItems,
      {
        itemId: firstItem?.id || '',
        itemName: firstItem?.name || 'New Item',
        qty: 1,
        unitPrice: price,
        taxRate: firstItem?.taxRate || 18,
        discountPercent: 0,
        total: price
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const toggleGst = (checked: boolean) => {
    setGstEnabled(checked);
    if (checked) {
      setLineItems(lineItems.map(line => {
        if (line.taxRate > 0) return line;
        const found = items.find(i => i.id === line.itemId);
        return { ...line, taxRate: found?.taxRate || 18 };
      }));
    }
  };

  // Calculations
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTax = 0;
  lineItems.forEach(line => {
    const base = (Number(line.qty) || 0) * (Number(line.unitPrice) || 0);
    const disc = base * ((Number(line.discountPercent) || 0) / 100);
    const afterDiscount = base - disc;
    
    subtotal += base;
    totalDiscount += disc;
    totalTax += gstEnabled ? afterDiscount * ((Number(line.taxRate) || 0) / 100) : 0;
  });

  const grandTotal = subtotal - totalDiscount + totalTax + Number(shippingCharges);

  // Auto payment status recommendation
  let computedStatus: PaymentStatus = 'unpaid';
  if (amountPaid >= grandTotal && grandTotal > 0) {
    computedStatus = 'paid';
  } else if (amountPaid > 0) {
    computedStatus = 'partial';
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine Party Name
    let finalPartyName = customPartyName.trim();
    if (!finalPartyName) {
      const selectedPartyObj = parties.find(p => p.id === partyId);
      finalPartyName = selectedPartyObj ? selectedPartyObj.name : 'Walk-in Customer';
    }

    const newInvoice: Invoice = {
      id: `inv-custom-${Date.now()}`,
      invoiceNo,
      type,
      partyId: partyId || `p-walkin-${Date.now()}`,
      partyName: finalPartyName,
      date,
      dueDate,
      items: lineItems.map((item, idx) => ({
        ...item,
        id: `line-${Date.now()}-${idx}`
      })),
      subtotal,
      totalDiscount,
      totalTax,
      shippingCharges: Number(shippingCharges) || 0,
      grandTotal,
      amountPaid: Number(amountPaid) || 0,
      paymentStatus: computedStatus,
      paymentMethod,
      notes,
      customTitle,
      customTerms,
      customFooter
    };

    onSave(newInvoice);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex justify-between items-center">
          <div>
            <span className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              Arham Traders Live Form
            </span>
            <h2 className="text-lg sm:text-xl font-bold mt-1">Create New Invoice / Billing Statement</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          
          {/* Top Quick settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice Direction</label>
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setType('sale');
                    if (invoiceNo.startsWith('PUR-')) {
                      setInvoiceNo(`INV-2026-${randomSuffix}`);
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-l-md border ${
                    type === 'sale' 
                      ? 'bg-emerald-600 text-white border-emerald-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  🟢 Sale (Outward)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('purchase');
                    if (invoiceNo.startsWith('INV-')) {
                      setInvoiceNo(`PUR-2026-${randomSuffix}`);
                    }
                  }}
                  className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-r-md border-t border-b border-r ${
                    type === 'purchase' 
                      ? 'bg-amber-600 text-white border-amber-600' 
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  📦 Purchase (Inward)
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Sale increments cash/receivables. Purchase represents vendor intake.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Invoice / Ref No.</label>
              <input
                type="text"
                required
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-mono font-bold focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bill Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs font-medium"
                />
              </div>
            </div>
          </div>

          {/* Customer / Supplier selection */}
          <div className="bg-red-50/50 p-4 rounded-lg border border-red-100">
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wide mb-2">
              {type === 'sale' ? 'Select Customer / Party' : 'Select Vendor / Supplier'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Choose from Directory Ledger</label>
                <select
                  value={partyId}
                  onChange={e => {
                    setPartyId(e.target.value);
                    setCustomPartyName('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
                >
                  <option value="">-- Manual/Walk-in Input Below --</option>
                  {parties
                    .filter(p => type === 'sale' ? true : p.type === 'supplier')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Ph: {p.phone})
                      </option>
                    ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Or enter manual name (Overrides selection)</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Walk-in Customer"
                  value={customPartyName}
                  onChange={e => setCustomPartyName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-sm placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Invoice Line Items
              </h3>
              <button
                type="button"
                onClick={addLine}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-left text-xs bg-white">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-600 uppercase">
                  <tr>
                    <th className="p-2 w-10 text-center">#</th>
                    <th className="p-2 min-w-[180px]">Inventory Item Selection</th>
                    <th className="p-2 w-32">Custom Description</th>
                    <th className="p-2 w-20 text-right">Qty</th>
                    <th className="p-2 w-24 text-right">Unit Rate ({currency})</th>
                    <th className="p-2 w-20 text-right">Disc %</th>
                    {gstEnabled && <th className="p-2 w-20 text-right">GST %</th>}
                    <th className="p-2 w-24 text-right font-bold">Subtotal</th>
                    <th className="p-2 w-10 text-center">Act</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-sm">
                  {lineItems.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2 text-center text-slate-400 font-sans">{idx + 1}</td>
                      
                      {/* Item Selector */}
                      <td className="p-2 font-sans">
                        <select
                          value={line.itemId}
                          onChange={e => handleItemSelect(idx, e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
                        >
                          <option value="">-- Custom Manual Item --</option>
                          {items.map(it => (
                            <option key={it.id} value={it.id}>
                              {it.name} (Stock: {it.stockQty}{it.unit}) - @{currency}{type === 'sale' ? it.sellingPrice : it.purchasePrice}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Custom Description text */}
                      <td className="p-2 font-sans">
                        <input
                          type="text"
                          required
                          value={line.itemName}
                          onChange={e => updateLineField(idx, 'itemName', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                          placeholder="Item Name"
                        />
                      </td>

                      {/* Qty */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={line.qty}
                          onChange={e => updateLineField(idx, 'qty', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs font-bold text-red-600"
                        />
                      </td>

                      {/* Unit Price */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={line.unitPrice}
                          onChange={e => updateLineField(idx, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs"
                        />
                      </td>

                      {/* Discount % */}
                      <td className="p-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={line.discountPercent}
                          onChange={e => updateLineField(idx, 'discountPercent', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-right text-xs text-emerald-700 font-bold"
                        />
                      </td>

                      {gstEnabled && (
                        <td className="p-2 font-sans">
                          <select
                            value={line.taxRate}
                            onChange={e => updateLineField(idx, 'taxRate', parseInt(e.target.value) || 0)}
                            className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-xs text-right"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                      )}

                      {/* Total computed */}
                      <td className="p-2 text-right font-bold text-slate-900 bg-slate-50">
                        {currency}{Number(line.total).toFixed(2)}
                      </td>

                      {/* Remove action */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          disabled={lineItems.length <= 1}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1 rounded"
                          title="Remove Row"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 mt-1 italic">
              * Changing the inventory item selection immediately loads its saved purchase or selling rate. You can still modify item name, quantity, rate and discount manually.
            </p>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-100">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">Customer Requirement Customization</h3>
              <label className="flex items-center gap-2 bg-black text-blue-300 border border-blue-400 rounded px-3 py-1.5 text-xs font-bold cursor-pointer shadow-[0_0_18px_rgba(0,229,255,0.35)]">
                <input
                  type="checkbox"
                  checked={gstEnabled}
                  onChange={e => toggleGst(e.target.checked)}
                  className="accent-cyan-400"
                />
                GST Optional
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Invoice Title</label>
                <input
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded p-2 text-xs font-bold"
                  placeholder="Invoice, Estimate, Proforma, Delivery Challan"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Custom Terms</label>
                <textarea
                  rows={2}
                  value={customTerms}
                  onChange={e => setCustomTerms(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Footer Message</label>
                <textarea
                  rows={2}
                  value={customFooter}
                  onChange={e => setCustomFooter(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Pricing breakdown & instant settlement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            
            {/* Payment Details Box */}
            <div className="space-y-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Instant Payment Collection
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-emerald-300 rounded px-2.5 py-1.5 text-xs font-bold uppercase text-slate-800"
                  >
                    <option value="cash">💵 Cash Counter</option>
                    <option value="upi">📱 BHIM / PhonePe / UPI</option>
                    <option value="bank">🏦 Bank NEFT / RTGS</option>
                    <option value="card">💳 Credit / Debit Card</option>
                    <option value="credit">⏳ Partial / Full Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1 font-medium">Amount Received</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">{currency}</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amountPaid === 0 ? '' : amountPaid}
                      onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full bg-white border border-emerald-300 rounded pl-6 pr-2 py-1.5 text-xs font-bold text-emerald-700 placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Auto-Assigned Status:</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    computedStatus === 'paid' ? 'bg-emerald-600 text-white' :
                    computedStatus === 'partial' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {computedStatus}
                  </span>
                </div>
                
                <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAmountPaid(grandTotal)}
                    className="bg-white hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded border border-emerald-300 cursor-pointer"
                  >
                    💡 Set Fully Paid ({currency}{grandTotal.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmountPaid(0)}
                    className="bg-white hover:bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded border border-slate-300 cursor-pointer"
                  >
                    Set Unpaid (₹0)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Shipping & Additional Charges</label>
                <div className="relative">
                  <span className="absolute left-2 top-1 text-xs text-slate-400 font-mono">{currency}</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={shippingCharges === 0 ? '' : shippingCharges}
                    onChange={e => setShippingCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 rounded pl-6 pr-2 py-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1 font-medium">Footer Remark / Guarantee Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs text-slate-700"
                  placeholder="Specific instructions or terms for this bill..."
                />
              </div>
            </div>

            {/* Calculations Total Column */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-300 flex flex-col justify-between font-mono">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide border-b pb-1 mb-3 font-sans">
                  Billing Calculations
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Cumulative Items Value:</span>
                    <span>{currency}{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Line item discounts:</span>
                      <span>-{currency}{totalDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {shippingCharges > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Shipping/Packing additions:</span>
                      <span>+{currency}{Number(shippingCharges).toFixed(2)}</span>
                    </div>
                  )}

                  {gstEnabled && (
                    <div className="flex justify-between text-blue-600 font-bold">
                      <span>Optional GST:</span>
                      <span>+{currency}{totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t-2 border-slate-800 my-2 pt-2 flex justify-between text-base font-black text-slate-900 bg-amber-100/60 p-2 rounded">
                    <span>GRAND TOTAL:</span>
                    <span className="text-red-600">{currency}{grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>Amount Received:</span>
                    <span className="font-bold text-emerald-600">{currency}{amountPaid.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 font-bold border-t border-dashed border-slate-300 pt-2">
                    <span>NET OUTSTANDING BALANCE:</span>
                    <span className="text-red-500">{currency}{Math.max(0, grandTotal - amountPaid).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Submit Action */}
              <div className="mt-6 pt-3 font-sans">
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wide text-sm"
                >
                  <Check className="w-5 h-5" />
                  <span>Generate Complete Invoice Statement</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Upon creation, this customized bill will be saved into your central ledger and can be shared with the party on WhatsApp.
                </p>
              </div>

            </div>

          </div>

        </form>

      </div>
    </div>
  );
};
