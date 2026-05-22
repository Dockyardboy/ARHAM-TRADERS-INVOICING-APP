import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Check, X } from 'lucide-react';
import { Party, PaymentDirection, PaymentMethod, PaymentRecord } from '../types';

interface PaymentModalProps {
  direction: PaymentDirection;
  parties: Party[];
  currency: string;
  onSave: (payment: PaymentRecord) => void;
  onClose: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  direction,
  parties,
  currency,
  onSave,
  onClose
}) => {
  const eligibleParties = parties.filter(p => direction === 'in' ? p.type === 'customer' : p.type === 'supplier');
  const [partyId, setPartyId] = useState(eligibleParties[0]?.id || parties[0]?.id || '');
  const [amount, setAmount] = useState<number>(1000);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(direction === 'in' ? 'Payment received against ledger balance' : 'Payment made against supplier ledger');

  const selectedParty = parties.find(p => p.id === partyId) || eligibleParties[0] || parties[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty || amount <= 0) return;

    onSave({
      id: `pay-${Date.now()}`,
      direction,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      amount: Number(amount) || 0,
      date,
      method,
      notes: notes.trim() || (direction === 'in' ? 'Payment received' : 'Payment made')
    });
  };

  const isPaymentIn = direction === 'in';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className={`${isPaymentIn ? 'bg-emerald-700' : 'bg-red-700'} text-white p-4 flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            {isPaymentIn ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
            <div>
              <h3 className="font-bold text-base">{isPaymentIn ? 'Record Payment In' : 'Record Payment Out'}</h3>
              <p className="text-[10px] text-white/80">Updates party ledger and cash balance immediately</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-slate-800 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-600 mb-1">
              {isPaymentIn ? 'Received From Customer' : 'Paid To Supplier'}
            </label>
            <select
              value={partyId}
              onChange={e => setPartyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-sm font-bold"
            >
              {eligibleParties.map(p => (
                <option key={p.id} value={p.id}>{p.name} | {p.phone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Amount ({currency})</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                className={`w-full bg-white border rounded p-2 text-base font-black ${isPaymentIn ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'}`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Payment Date</label>
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
            <label className="block font-bold text-slate-600 mb-1">Payment Method</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs uppercase font-bold"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="credit">Credit Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 cursor-pointer text-xs">
              Cancel
            </button>
            <button
              type="submit"
              className={`${isPaymentIn ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white font-bold px-4 py-1.5 rounded flex items-center gap-1 cursor-pointer text-xs`}
            >
              <Check className="w-4 h-4" />
              <span>{isPaymentIn ? 'Save Payment In' : 'Save Payment Out'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};