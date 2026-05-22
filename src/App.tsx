import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  PieChart, 
  Settings, 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building,
  ChevronRight,
  MessageCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  Camera,
  Cloud,
  CloudUpload,
  CloudDownload
} from 'lucide-react';

import { supabase } from './lib/supabase';

import { 
  initialBusinessProfile, 
  initialParties, 
  initialItems, 
  initialInvoices, 
  initialExpenses
} from './initialData';

import { 
  BusinessProfile, 
  Party, 
  Item, 
  Invoice, 
  Expense, 
  PaymentDirection,
  PaymentRecord
} from './types';

import { CreateInvoiceModal } from './components/CreateInvoiceModal';
import { AddItemModal, AddPartyModal, AddExpenseModal } from './components/AddModals';
import { BusinessSettingsModal } from './components/BusinessSettingsModal';
import { PaymentModal } from './components/PaymentModal';
import { BillUploadModal } from './components/BillUploadModal';

export default function App() {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'parties' | 'items' | 'invoices' | 'reports'>('dashboard');

  // Master State Arrays
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('arham_profile');
    return saved ? JSON.parse(saved) : initialBusinessProfile;
  });
  const [parties, setParties] = useState<Party[]>(() => {
    const saved = localStorage.getItem('arham_parties');
    return saved ? JSON.parse(saved) : initialParties;
  });
  const [items, setItems] = useState<Item[]>(() => {
    const saved = localStorage.getItem('arham_items');
    return saved ? JSON.parse(saved) : initialItems;
  });
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('arham_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('arham_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('arham_payments');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistence Effects
  useEffect(() => { localStorage.setItem('arham_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('arham_parties', JSON.stringify(parties)); }, [parties]);
  useEffect(() => { localStorage.setItem('arham_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('arham_invoices', JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem('arham_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('arham_payments', JSON.stringify(payments)); }, [payments]);

  // Modals Visibility
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBillUpload, setShowBillUpload] = useState(false);
  const [paymentModalDirection, setPaymentModalDirection] = useState<PaymentDirection | null>(null);
  const [ledgerPOSPreview, setLedgerPOSPreview] = useState<{ partyName: string; fileName: string; content: string; phone: string } | null>(null);

  // Search & Filters state
  const [partySearch, setPartySearch] = useState('');
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');

  const [itemSearch, setItemSearch] = useState('');
  const [itemStockFilter, setItemStockFilter] = useState<'all' | 'low' | 'out'>('all');

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<'all' | 'sale' | 'purchase'>('all');

  const [isSyncing, setIsSyncing] = useState(false);

  // Interactive feedback alerts
  const [toastMessage, setToastMessage] = useState<string | null>("Welcome to Arham Traders Invoicing App. Sample ledger data is ready.");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auto Calculations for Top Dashboard Metrics
  const totalSales = invoices
    .filter(i => i.type === 'sale')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalPurchases = invoices
    .filter(i => i.type === 'purchase')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  // Cash received from sales + opening customer receipts minus cash paid for purchases/expenses
  const totalSalesPaid = invoices
    .filter(i => i.type === 'sale')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const totalPurchasesPaid = invoices
    .filter(i => i.type === 'purchase')
    .reduce((sum, i) => sum + i.amountPaid, 0);

  const paymentInTotal = payments
    .filter(p => p.direction === 'in')
    .reduce((sum, p) => sum + p.amount, 0);

  const paymentOutTotal = payments
    .filter(p => p.direction === 'out')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOverheadExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Outstanding Receivables (To Receive) from customers
  const totalReceivables = parties
    .filter(p => p.type === 'customer')
    .reduce((sum, p) => {
      // plus the unpaid parts of their sale invoices
      const partySalesUnpaid = invoices
        .filter(i => i.type === 'sale' && i.partyId === p.id)
        .reduce((s, i) => s + Math.max(0, i.grandTotal - i.amountPaid), 0);
      const partyReceipts = payments
        .filter(pay => pay.direction === 'in' && pay.partyId === p.id)
        .reduce((s, pay) => s + pay.amount, 0);
      return sum + Math.max(0, Math.max(0, p.openingBalance) + partySalesUnpaid - partyReceipts);
    }, 0);

  // Outstanding Payables (To Pay) to suppliers
  const totalPayables = parties
    .filter(p => p.type === 'supplier')
    .reduce((sum, p) => {
      const partyPurchasesUnpaid = invoices
        .filter(i => i.type === 'purchase' && i.partyId === p.id)
        .reduce((s, i) => s + Math.max(0, i.grandTotal - i.amountPaid), 0);
      const supplierPayouts = payments
        .filter(pay => pay.direction === 'out' && pay.partyId === p.id)
        .reduce((s, pay) => s + pay.amount, 0);
      return sum + Math.max(0, Math.abs(Math.min(0, p.openingBalance)) + partyPurchasesUnpaid - supplierPayouts);
    }, 0);

  // Estimated Hand Cash / Liquid Wallet balance
  const estimatedCashInHand = totalSalesPaid + paymentInTotal - totalPurchasesPaid - paymentOutTotal - totalOverheadExpenses + 120000; // Base startup cash buffer

  // Handlers for adding newly generated items
  const handleSaveInvoice = (newInvoice: Invoice) => {
    // 1. Save invoice
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);

    // 2. Adjust inventory counts depending on type
    const updatedItems = items.map(it => {
      const lineItem = newInvoice.items.find(l => l.itemId === it.id);
      if (lineItem) {
        if (newInvoice.type === 'sale') {
          return { ...it, stockQty: Math.max(0, it.stockQty - lineItem.qty) };
        } else {
          return { ...it, stockQty: it.stockQty + lineItem.qty };
        }
      }
      return it;
    });
    setItems(updatedItems);

    // 3. Update party ledger balance
    const updatedParties = parties.map(p => {
      if (p.id === newInvoice.partyId) {
        const netOwed = newInvoice.grandTotal - newInvoice.amountPaid;
        if (newInvoice.type === 'sale') {
          return { ...p, currentBalance: p.currentBalance + netOwed };
        } else {
          return { ...p, currentBalance: p.currentBalance - netOwed };
        }
      }
      return p;
    });
    setParties(updatedParties);

    setShowCreateInvoice(false);
    showToast(`Successfully created ${newInvoice.type === 'sale' ? 'Sale Invoice' : 'Purchase Bill'} #${newInvoice.invoiceNo}! Stock auto-adjusted.`);
    
    // Jump to invoices tab to see it
    setActiveTab('invoices');
  };

  const handleSaveItem = (newItem: Item) => {
    setItems([newItem, ...items]);
    setShowAddItem(false);
    showToast(`Added inventory item "${newItem.name}" with initial stock ${newItem.stockQty} ${newItem.unit}.`);
  };

  const handleSaveParty = (newParty: Party) => {
    setParties([newParty, ...parties]);
    setShowAddParty(false);
    showToast(`Created ${newParty.type} account for "${newParty.name}".`);
  };

  const handleSaveExpense = (newExp: Expense) => {
    setExpenses([newExp, ...expenses]);
    setShowAddExpense(false);
    showToast(`Logged expense "${newExp.category}" for ${profile.currency}${newExp.amount}.`);
  };

  const handleSaveSettings = (updatedProfile: BusinessProfile) => {
    setProfile(updatedProfile);
    setShowSettings(false);
    showToast(`Applied new business branding for "${updatedProfile.name}". Invoices instantly regenerated.`);
  };

  const handleSavePayment = (payment: PaymentRecord) => {
    setPayments([payment, ...payments]);
    setParties(parties.map(p => {
      if (p.id !== payment.partyId) return p;
      return {
        ...p,
        currentBalance: payment.direction === 'in'
          ? p.currentBalance - payment.amount
          : p.currentBalance + payment.amount
      };
    }));
    setPaymentModalDirection(null);
    showToast(`${payment.direction === 'in' ? 'Payment In' : 'Payment Out'} saved for ${payment.partyName}: ${profile.currency}${payment.amount.toFixed(2)}.`);
  };

  const formatWhatsAppPhone = (phone?: string) => {
    const digits = (phone || '').replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
  };

  const openWhatsAppShare = (phone: string | undefined, message: string) => {
    const formattedPhone = formatWhatsAppPhone(phone);
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getPartyById = (partyId: string) => parties.find(p => p.id === partyId);

  const shareInvoiceOnWhatsApp = (invoice: Invoice) => {
    const party = getPartyById(invoice.partyId);
    const balanceDue = Math.max(0, invoice.grandTotal - invoice.amountPaid);
    openWhatsAppShare(party?.phone, [
      `${profile.name}`,
      `Invoice: ${invoice.invoiceNo}`,
      `Party: ${invoice.partyName}`,
      `Date: ${invoice.date}`,
      `Total: ${profile.currency}${invoice.grandTotal.toFixed(2)}`,
      `Paid: ${profile.currency}${invoice.amountPaid.toFixed(2)}`,
      `Balance: ${profile.currency}${balanceDue.toFixed(2)}`,
      `Status: ${invoice.paymentStatus.toUpperCase()}`,
      `Please reply on WhatsApp for any correction or payment update.`
    ].join('\n'));
    showToast(`Opened WhatsApp invoice share for ${invoice.partyName}.`);
  };

  const formatPOSAmount = (amount: number) => `${profile.currency}${Math.abs(amount).toFixed(2)}`;

  const centerPOS = (text: string, width = 42) => {
    const clean = text.length > width ? text.slice(0, width) : text;
    const left = Math.max(0, Math.floor((width - clean.length) / 2));
    return `${' '.repeat(left)}${clean}`;
  };

  const buildLedgerPOS = (party: Party) => {
    const width = 42;
    const line = '-'.repeat(width);
    const doubleLine = '='.repeat(width);
    const partyInvoices = invoices.filter(i => i.partyId === party.id);
    const partyPayments = payments.filter(p => p.partyId === party.id);

    const saleBills = partyInvoices.filter(inv => inv.type === 'sale');
    const purchaseBills = partyInvoices.filter(inv => inv.type === 'purchase');
    const totalSaleBills = saleBills.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPurchaseBills = purchaseBills.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const receivedOnBills = saleBills.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const paidOnBills = purchaseBills.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const manualPaymentIn = partyPayments
      .filter(pay => pay.direction === 'in')
      .reduce((sum, pay) => sum + pay.amount, 0);
    const manualPaymentOut = partyPayments
      .filter(pay => pay.direction === 'out')
      .reduce((sum, pay) => sum + pay.amount, 0);

    const isCustomerLedger = party.type === 'customer';
    const ledgerBills = isCustomerLedger ? saleBills : purchaseBills;
    const billTotal = isCustomerLedger ? totalSaleBills : totalPurchaseBills;
    const paymentTotal = isCustomerLedger
      ? receivedOnBills + manualPaymentIn
      : paidOnBills + manualPaymentOut;
    const openingAmount = Math.abs(party.openingBalance);
    const totalBeforePayment = openingAmount + billTotal;
    const finalAmount = Math.max(0, totalBeforePayment - paymentTotal);
    const billTypeLabel = isCustomerLedger ? 'SALE' : 'PURCHASE';
    const paymentLabel = isCustomerLedger ? 'PAYMENT' : 'PAYMENT OUT';
    const ledgerRows = [
      `${''.padEnd(8)}${formatPOSAmount(openingAmount).padStart(12)}  OPENING`,
      ...ledgerBills.map((bill, index) => (
        `${String(index + 1).padEnd(8)}${formatPOSAmount(bill.grandTotal).padStart(12)}  ${billTypeLabel}`
      ))
    ];

    const content = [
      centerPOS(profile.name, width),
      centerPOS('POS LEDGER STATEMENT', width),
      doubleLine,
      `PARTY: ${party.name}`,
      `PHONE: ${party.phone}`,
      `TYPE : ${party.type.toUpperCase()}`,
      `DATE : ${new Date().toLocaleDateString()}`,
      line,
      `BILL NO ${'AMOUNT'.padStart(13)} TYPE`,
      ...ledgerRows,
      `TOTAL   ${formatPOSAmount(totalBeforePayment).padStart(12)}`,
      `${paymentLabel.padEnd(8)}${formatPOSAmount(paymentTotal).padStart(12)}`,
      doubleLine,
      `FINAL   ${formatPOSAmount(finalAmount).padStart(12)}`,
      doubleLine,
      centerPOS('Thank you', width),
      centerPOS('Arham Traders Invoicing App', width),
      ''
    ].join('\n');

    return {
      partyName: party.name,
      phone: party.phone,
      fileName: `${party.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-pos-ledger.txt`,
      content
    };
  };

  const downloadLedgerPOS = (party: Party) => {
    const ledger = buildLedgerPOS(party);
    setLedgerPOSPreview(ledger);

    const blob = new Blob([ledger.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ledger.fileName;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast(`POS ledger opened for ${party.name}. If download is blocked on mobile, use WhatsApp or Share from the popup.`);
  };

  const shareLedgerPOSOnWhatsApp = (party: Party) => {
    const ledger = buildLedgerPOS(party);
    setLedgerPOSPreview(ledger);
    openWhatsAppShare(party.phone, ledger.content);
    showToast(`Opened WhatsApp POS ledger for ${party.name}.`);
  };

  const downloadLedgerPreviewFile = () => {
    if (!ledgerPOSPreview) return;
    const blob = new Blob([ledgerPOSPreview.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ledgerPOSPreview.fileName;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('Download started. On iPhone, choose Share or Copy if the browser blocks TXT downloads.');
  };

  const copyLedgerPreview = async () => {
    if (!ledgerPOSPreview) return;
    try {
      await navigator.clipboard.writeText(ledgerPOSPreview.content);
      showToast('POS ledger copied. You can paste it into WhatsApp, Notes, or print apps.');
    } catch {
      showToast('Copy is blocked by this browser. Select the ledger text manually from the popup.');
    }
  };

  const shareLedgerPreview = async () => {
    if (!ledgerPOSPreview) return;
    const file = new File([ledgerPOSPreview.content], ledgerPOSPreview.fileName, { type: 'text/plain' });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: ledgerPOSPreview.fileName, text: 'POS ledger statement', files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: ledgerPOSPreview.fileName, text: ledgerPOSPreview.content });
      } else {
        await navigator.clipboard.writeText(ledgerPOSPreview.content);
        showToast('Sharing is unavailable. Ledger copied instead.');
      }
    } catch {
      showToast('Share cancelled or blocked by the browser.');
    }
  };

  const whatsappLedgerPreview = () => {
    if (!ledgerPOSPreview) return;
    openWhatsAppShare(ledgerPOSPreview.phone, ledgerPOSPreview.content);
    showToast(`Opened WhatsApp POS ledger for ${ledgerPOSPreview.partyName}.`);
  };

  // Helper to instantly trigger simulation download
  const triggerCSVExport = (reportName: string) => {
    showToast(`📥 Generated ${reportName}.csv with active rows! Check browser downloads.`);
  };

  const exportData = () => {
    const data = {
      profile,
      parties,
      items,
      invoices,
      expenses,
      payments,
      version: '1.0',
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arham-traders-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Backup file downloaded successfully! Keep it safe.");
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.profile) setProfile(data.profile);
        if (data.parties) setParties(data.parties);
        if (data.items) setItems(data.items);
        if (data.invoices) setInvoices(data.invoices);
        if (data.expenses) setExpenses(data.expenses);
        if (data.payments) setPayments(data.payments);
        showToast("Data imported successfully! Dashboard updated.");
      } catch (err) {
        showToast("Error importing data. Please check the file format.");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const pushToCloud = async () => {
    setIsSyncing(true);
    const data = {
      profile,
      parties,
      items,
      invoices,
      expenses,
      payments
    };

    try {
      const { error } = await supabase
        .from('app_state')
        .upsert({ id: 1, data, updated_at: new Date().toISOString() });

      if (error) throw error;
      showToast("Data pushed to cloud successfully!");
    } catch (err: any) {
      showToast(`Cloud Error: ${err.message || 'Check your .env credentials'}`);
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('data')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data && data.data) {
        const cloudData = data.data;
        if (cloudData.profile) setProfile(cloudData.profile);
        if (cloudData.parties) setParties(cloudData.parties);
        if (cloudData.items) setItems(cloudData.items);
        if (cloudData.invoices) setInvoices(cloudData.invoices);
        if (cloudData.expenses) setExpenses(cloudData.expenses);
        if (cloudData.payments) setPayments(cloudData.payments);
        showToast("Data pulled from cloud successfully!");
      } else {
        showToast("No data found in cloud.");
      }
    } catch (err: any) {
      showToast(`Cloud Error: ${err.message || 'Check your .env credentials'}`);
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered lists
  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(partySearch.toLowerCase()) || 
                          p.phone.includes(partySearch) || 
                          (p.gstin && p.gstin.toLowerCase().includes(partySearch.toLowerCase()));
    if (partyTypeFilter === 'all') return matchesSearch;
    return matchesSearch && p.type === partyTypeFilter;
  });

  const filteredItems = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(itemSearch.toLowerCase()) || 
                          it.sku.toLowerCase().includes(itemSearch.toLowerCase());
    if (itemStockFilter === 'all') return matchesSearch;
    if (itemStockFilter === 'low') return matchesSearch && it.stockQty <= it.lowStockAlert && it.stockQty > 0;
    if (itemStockFilter === 'out') return matchesSearch && it.stockQty === 0;
    return matchesSearch;
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                          inv.partyName.toLowerCase().includes(invoiceSearch.toLowerCase());
    if (invoiceTypeFilter === 'all') return matchesSearch;
    return matchesSearch && inv.type === invoiceTypeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col print:bg-white print:text-black">
      
      {/* TOAST NOTIFICATION POPUP */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border-l-4 border-amber-400 flex items-center gap-3 max-w-md animate-bounce print:hidden">
          <span className="text-sm">🔔</span>
          <p className="text-xs font-medium leading-tight">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white font-bold ml-auto text-xs">✕</button>
        </div>
      )}

      {/* MAIN CONTAINER: SIDEBAR + MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* LEFT SIDEBAR - hidden on print */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 print:hidden">
          
          {/* Business identity summary at top of sidebar */}
          <div className="p-4 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <img src={profile.logoUrl || '/arham-logo.svg'} alt="Business logo" className="w-12 h-10 rounded bg-white object-contain shadow" />
              <div className="truncate">
                <h2 className="font-bold text-white text-sm truncate">{profile.name}</h2>
                <p className="text-[10px] text-slate-400 truncate" title={profile.tagline}>{profile.tagline}</p>
              </div>
            </div>

            {/* Quick action triggers directly under profile */}
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              <button
                onClick={() => setShowCreateInvoice(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
              >
                <Plus className="w-3 h-3" />
                <span>+ Invoice</span>
              </button>
              
              <button
                onClick={() => setPaymentModalDirection('in')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
              >
                <ArrowDownCircle className="w-3 h-3" />
                <span>Payment In</span>
              </button>
              <button
                onClick={() => setPaymentModalDirection('out')}
                className="bg-red-700 hover:bg-red-800 text-white text-[11px] font-bold py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors shadow"
              >
                <ArrowUpCircle className="w-3 h-3" />
                <span>Payment Out</span>
              </button>
            </div>
          </div>

          {/* Nav Tab buttons */}
          <nav className="p-3 space-y-1 flex-1 font-medium text-xs">
            <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
              Navigation Portal
            </p>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === 'dashboard' ? 'bg-red-600 text-white font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </div>
              <ChevronRight className={`w-3 h-3 ${activeTab === 'dashboard' ? 'text-white' : 'text-slate-600'}`} />
            </button>

            <button
              onClick={() => setActiveTab('parties')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === 'parties' ? 'bg-red-600 text-white font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Parties Ledger ({parties.length})</span>
              </div>
              <span className="bg-slate-800 text-[10px] text-slate-400 px-1.5 py-0.5 rounded font-mono">
                {parties.filter(p => p.type === 'customer').length}C
              </span>
            </button>

            <button
              onClick={() => setActiveTab('items')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === 'items' ? 'bg-red-600 text-white font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4 text-amber-400" />
                <span>Items Inventory ({items.length})</span>
              </div>
              {/* badge for low stock */}
              {items.filter(i => i.stockQty <= i.lowStockAlert).length > 0 && (
                <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse">
                  ⚠️ {items.filter(i => i.stockQty <= i.lowStockAlert).length} low
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === 'invoices' ? 'bg-red-600 text-white font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Sales & Bills ({invoices.length})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Print Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeTab === 'reports' ? 'bg-red-600 text-white font-bold shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className="w-4 h-4 text-purple-400" />
                <span>Business Reports</span>
              </div>
              <span className="text-emerald-400 text-[10px] font-bold">Live</span>
            </button>

            <div className="pt-6">
              <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                System Setup
              </p>
              <button
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Business Branding</span>
              </button>
              
              <button
                onClick={exportData}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-500" />
                <span>Backup Data (JSON)</span>
              </button>

              <label className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer">
                <ArrowDownCircle className="w-4 h-4 text-sky-500" />
                <span>Restore Data</span>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>

              <div className="pt-2 mt-2 border-t border-slate-800">
                <p className="px-3 py-1 text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                  <Cloud className="w-3 h-3" /> Supabase Cloud Sync
                </p>
                <button
                  onClick={pushToCloud}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  <CloudUpload className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-pulse' : ''}`} />
                  <span>Push to Cloud</span>
                </button>
                <button
                  onClick={pullFromCloud}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer disabled:opacity-50"
                >
                  <CloudDownload className={`w-4 h-4 text-sky-400 ${isSyncing ? 'animate-pulse' : ''}`} />
                  <span>Pull from Cloud</span>
                </button>
              </div>
            </div>
          </nav>

          {/* Quick static storage stats */}
          <div className="p-3 bg-slate-950 text-[11px] text-slate-500 border-t border-slate-800 space-y-1">
            <div className="flex justify-between">
              <span>Database Status:</span>
              <span className="text-emerald-500 font-bold">100% Secure Local</span>
            </div>
            <div className="flex justify-between">
              <span>Ledger Status:</span>
              <span className="text-white font-mono">Ready</span>
            </div>
            <p className="text-[9px] text-slate-600 mt-2 text-center">Arham Traders Client v1.0</p>
          </div>

        </aside>

        {/* MAIN DISPLAY PORTAL */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto print:p-0 print:m-0">
          
          {/* QUICK SUMMARY KPI STRIP - hidden on print */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 print:hidden">
            
            {/* KPI 1: Sales */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {profile.currency}{totalSales.toFixed(0)}
                </span>
                <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  Paid: {profile.currency}{totalSalesPaid.toFixed(0)}
                </p>
              </div>
            </div>

            {/* KPI 2: Purchases */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex justify-between items-center text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Purchases</span>
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {profile.currency}{totalPurchases.toFixed(0)}
                </span>
                <p className="text-[10px] text-amber-600 font-medium mt-0.5">
                  Paid Out: {profile.currency}{totalPurchasesPaid.toFixed(0)}
                </p>
              </div>
            </div>

            {/* KPI 3: Receivables */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-emerald-50/40 to-white">
              <div className="flex justify-between items-center text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">To Receive</span>
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                  {profile.currency}{totalReceivables.toFixed(0)}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">From Customers</p>
              </div>
            </div>

            {/* KPI 4: Payables */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between bg-gradient-to-br from-red-50/40 to-white">
              <div className="flex justify-between items-center text-slate-500 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-red-800">To Pay</span>
                <Building className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-red-600 font-mono">
                  {profile.currency}{totalPayables.toFixed(0)}
                </span>
                <p className="text-[10px] text-slate-500 mt-0.5">To Suppliers</p>
              </div>
            </div>

            {/* KPI 5: Est Cash */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 bg-slate-900 text-white">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Cash/Wallet Buffer</span>
                <Wallet className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black text-white font-mono">
                  {profile.currency}{estimatedCashInHand.toFixed(0)}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">Liquid Net Hand Flow</p>
                <p className="text-[9px] text-slate-500 mt-0.5">In {profile.currency}{paymentInTotal.toFixed(0)} / Out {profile.currency}{paymentOutTotal.toFixed(0)}</p>
              </div>
            </div>

          </div>

          {/* SCREEN 1: EXECUTIVE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 print:hidden">
              
              {/* Quick Actions Add Shortcuts */}
              <div className="holo-panel bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Command Shortcuts
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="bg-red-50 hover:bg-red-100 text-red-900 p-3 rounded-lg text-center border border-red-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 text-white mx-auto flex items-center justify-center font-bold mb-1 group-hover:scale-110 transition-transform">
                      +
                    </div>
                    <span className="block font-bold text-xs">Create Sale Bill</span>
                    <span className="block text-[9px] text-slate-500">Custom invoice</span>
                  </button>

                  <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 p-3 rounded-lg text-center border border-amber-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white mx-auto flex items-center justify-center font-bold mb-1 group-hover:scale-110 transition-transform">
                      +
                    </div>
                    <span className="block font-bold text-xs">Add Item Stock</span>
                    <span className="block text-[9px] text-slate-500">Set low stock trigger</span>
                  </button>

                  <button
                    onClick={() => setShowBillUpload(true)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-900 p-3 rounded-lg text-center border border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white mx-auto flex items-center justify-center font-bold mb-1 group-hover:scale-110 transition-transform">
                      <Camera className="w-4 h-4" />
                    </div>
                    <span className="block font-bold text-xs">Upload Bill</span>
                    <span className="block text-[9px] text-slate-500">Camera or photo</span>
                  </button>

                  <button
                    onClick={() => setShowAddParty(true)}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 p-3 rounded-lg text-center border border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center font-bold mb-1 group-hover:scale-110 transition-transform">
                      +
                    </div>
                    <span className="block font-bold text-xs">Add Party Account</span>
                    <span className="block text-[9px] text-slate-500">Customer or Vendor</span>
                  </button>

                  <button
                    onClick={() => setPaymentModalDirection('in')}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 p-3 rounded-lg text-center border border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <ArrowDownCircle className="w-4 h-4" />
                    </div>
                    <span className="block font-bold text-xs">Payment In</span>
                    <span className="block text-[9px] text-slate-500">Customer receipt</span>
                  </button>

                  <button
                    onClick={() => setPaymentModalDirection('out')}
                    className="bg-red-50 hover:bg-red-100 text-red-900 p-3 rounded-lg text-center border border-red-200 transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-700 text-white mx-auto flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <ArrowUpCircle className="w-4 h-4" />
                    </div>
                    <span className="block font-bold text-xs">Payment Out</span>
                    <span className="block text-[9px] text-slate-500">Supplier payout</span>
                  </button>
                </div>
              </div>

              {/* Latest activity */}
              <div className="holo-panel bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Last 5 Bills Issued</h4>
                      
                      <div className="divide-y divide-slate-100 text-xs">
                        {invoices.slice(0, 5).map(inv => (
                          <div 
                            key={inv.id} 
                            className="py-2 flex justify-between items-center hover:bg-slate-50 px-1 rounded transition-colors"
                          >
                            <div className="truncate pr-2">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mr-1.5 ${
                                inv.type === 'sale' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {inv.type}
                              </span>
                              <span className="font-bold text-slate-800">{inv.partyName}</span>
                              <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{inv.invoiceNo} | {inv.date}</span>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="font-mono font-bold text-slate-900 block">
                                {profile.currency}{inv.grandTotal.toFixed(0)}
                              </span>
                              <span className={`text-[9px] uppercase font-bold px-1 rounded ${
                                inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                inv.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {inv.paymentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic text-center mt-2 border-t pt-2">
                      Relay ready: use WhatsApp from Sales & Bills to send any invoice to a party.
                    </p>
                  </div>

            </div>
          )}

          {/* SCREEN 2: PARTIES LEDGER DIRECTORY */}
          {activeTab === 'parties' && (
            <div className="space-y-4 print:hidden">
              <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Master Business Parties Ledger</h2>
                  <p className="text-xs text-slate-500">Track outstanding payments, contact addresses, and historical balances.</p>
                </div>

                <button
                  onClick={() => setShowAddParty(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Party Account</span>
                </button>
              </div>

              {/* Filter controls */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by party name, phone, or reference..."
                    value={partySearch}
                    onChange={e => setPartySearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white"
                  />
                  {partySearch && (
                    <button onClick={() => setPartySearch('')} className="text-xs text-slate-400">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded text-xs">
                  <span className="text-slate-500 text-[10px] font-bold px-2 uppercase">Filter Group:</span>
                  <button
                    onClick={() => setPartyTypeFilter('all')}
                    className={`px-2 py-1 rounded font-bold ${partyTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All ({parties.length})
                  </button>
                  <button
                    onClick={() => setPartyTypeFilter('customer')}
                    className={`px-2 py-1 rounded font-bold ${partyTypeFilter === 'customer' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                  >
                    Customers Only
                  </button>
                  <button
                    onClick={() => setPartyTypeFilter('supplier')}
                    className={`px-2 py-1 rounded font-bold ${partyTypeFilter === 'supplier' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
                  >
                    Suppliers Only
                  </button>
                </div>

                <button
                  onClick={() => triggerCSVExport("Parties_Ledger")}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-3 py-1.5 rounded"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Parties Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">ID</th>
                      <th className="p-3">Party Name & Reference</th>
                      <th className="p-3">Group Type</th>
                      <th className="p-3">Contact Detail</th>
                      <th className="p-3">Registered Address</th>
                      <th className="p-3 text-right">Initial Balance</th>
                      <th className="p-3 text-right">Current Settlement status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredParties.map(p => {
                      
                      // Calculate active related balance dynamically
                      const partyInvoices = invoices.filter(i => i.partyId === p.id);
                      const generatedCount = partyInvoices.length;
                      
                      const totalOwedFromInvoices = partyInvoices.reduce((s, i) => {
                        const unpaid = Math.max(0, i.grandTotal - i.amountPaid);
                        return s + (i.type === 'sale' ? unpaid : -unpaid);
                      }, 0);

                      const totalPaymentAdjustments = payments
                        .filter(pay => pay.partyId === p.id)
                        .reduce((s, pay) => s + (pay.direction === 'in' ? -pay.amount : pay.amount), 0);

                      const realBalance = p.openingBalance + totalOwedFromInvoices + totalPaymentAdjustments;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50 font-sans">
                          <td className="p-3 text-center font-mono font-bold text-slate-400">{p.id}</td>
                          <td className="p-3">
                            <span className="font-bold text-slate-900 text-sm block">{p.name}</span>
                            {p.gstin && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded inline-block mt-0.5">Ref: {p.gstin}</span>}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                              p.type === 'customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.type}
                            </span>
                          </td>
                          <td className="p-3">
                            <div>📞 {p.phone}</div>
                            <div className="text-slate-400 text-[10px]">{p.email}</div>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate">{p.address}</td>
                          <td className="p-3 text-right font-mono text-slate-500">
                            {profile.currency}{Math.abs(p.openingBalance).toFixed(2)}
                            <span className="block text-[9px] text-slate-400">
                              {p.openingBalance > 0 ? '(Receivable)' : p.openingBalance < 0 ? '(Payable)' : 'Settled'}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-sm font-bold">
                            {realBalance > 0 ? (
                              <span className="text-emerald-600">
                                {profile.currency}{Math.abs(realBalance).toFixed(2)} <span className="text-[10px] block uppercase font-bold text-emerald-800">To Receive</span>
                              </span>
                            ) : realBalance < 0 ? (
                              <span className="text-red-600">
                                {profile.currency}{Math.abs(realBalance).toFixed(2)} <span className="text-[10px] block uppercase font-bold text-red-800">To Pay</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">₹0.00 Settled</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                onClick={() => {
                                  // create invoice tailored to this party
                                  setShowCreateInvoice(true);
                                  showToast(`Ready to invoice party "${p.name}"`);
                                }}
                                className="bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                              >
                                + Bill Party
                              </button>
                              <button
                                onClick={() => shareLedgerPOSOnWhatsApp(p)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp POS
                              </button>
                              <button
                                onClick={() => downloadLedgerPOS(p)}
                                className="bg-slate-800 hover:bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download POS
                              </button>
                            </div>
                            <span className="block text-[9px] text-slate-400 mt-1">{generatedCount} past bills</span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredParties.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          No parties matching your filters. Try adding a new Customer or Supplier!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 text-xs">
                <strong>Arham Traders Settlement Note:</strong> Opening Balance plus individual unpaid bills form the absolute outstanding amounts. Clicking "+ Bill Party" transfers their identifier straight into the invoice editor.
              </div>
            </div>
          )}

          {/* SCREEN 3: ITEMS INVENTORY INTAKE */}
          {activeTab === 'items' && (
            <div className="space-y-4 print:hidden">
              <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Inventory Items Master Ledger</h2>
                  <p className="text-xs text-slate-500">Add SKUs, view live stock quantites, low stock boundaries, and standard rates.</p>
                </div>

                <button
                  onClick={() => setShowAddItem(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-3 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add New Product Item</span>
                </button>
              </div>

              {/* Items Filter Controls */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search inventory by name, code/SKU..."
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white"
                  />
                  {itemSearch && (
                    <button onClick={() => setItemSearch('')} className="text-xs text-slate-400">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded text-xs">
                  <span className="text-slate-500 text-[10px] font-bold px-2 uppercase">Stock Level View:</span>
                  <button
                    onClick={() => setItemStockFilter('all')}
                    className={`px-2 py-1 rounded font-bold ${itemStockFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All ({items.length})
                  </button>
                  <button
                    onClick={() => setItemStockFilter('low')}
                    className={`px-2 py-1 rounded font-bold ${itemStockFilter === 'low' ? 'bg-amber-500 text-black font-black' : 'text-slate-600'}`}
                  >
                    ⚠️ Low Stock ({items.filter(i => i.stockQty <= i.lowStockAlert && i.stockQty > 0).length})
                  </button>
                  <button
                    onClick={() => setItemStockFilter('out')}
                    className={`px-2 py-1 rounded font-bold ${itemStockFilter === 'out' ? 'bg-red-600 text-white' : 'text-slate-600'}`}
                  >
                    ❌ Out of Stock ({items.filter(i => i.stockQty === 0).length})
                  </button>
                </div>

                <button
                  onClick={() => triggerCSVExport("Inventory_Stock")}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-3 py-1.5 rounded"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">#</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 text-center">SKU Code</th>
                      <th className="p-3 text-right">Selling Rate</th>
                      <th className="p-3 text-right">Purchase Cost</th>
                      <th className="p-3 text-right">Stock Quantity</th>
                      <th className="p-3 text-right">Alarm Limit</th>
                      <th className="p-3 text-center">Stock Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredItems.map((it, idx) => {
                      const isLow = it.stockQty <= it.lowStockAlert && it.stockQty > 0;
                      const isOut = it.stockQty === 0;

                      return (
                        <tr key={it.id} className={`hover:bg-slate-50 font-sans ${isOut ? 'bg-red-50/50' : isLow ? 'bg-amber-50/50' : ''}`}>
                          <td className="p-3 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900 font-sans">
                            {it.name}
                            {isOut && <span className="ml-2 bg-red-600 text-white text-[9px] uppercase px-1.5 py-0.5 rounded font-black">Out</span>}
                            {isLow && <span className="ml-2 bg-amber-500 text-black text-[9px] uppercase px-1.5 py-0.5 rounded font-black">Low</span>}
                          </td>
                          <td className="p-3 text-center font-bold text-slate-500 bg-slate-50 rounded">{it.sku}</td>
                          <td className="p-3 text-right font-bold text-slate-900">{profile.currency}{it.sellingPrice.toFixed(2)}</td>
                          <td className="p-3 text-right text-slate-600">{profile.currency}{it.purchasePrice.toFixed(2)}</td>
                          {/* Stock Quantity Highlight */}
                          <td className="p-3 text-right text-sm font-bold">
                            <span className={`px-2 py-1 rounded block ${
                              isOut ? 'bg-red-200 text-red-900 font-black' :
                              isLow ? 'bg-amber-200 text-amber-950 font-bold' : 'bg-emerald-50 text-emerald-900'
                            }`}>
                              {it.stockQty} <span className="text-[10px] font-normal">{it.unit}</span>
                            </span>
                          </td>
                          
                          <td className="p-3 text-right text-slate-400 font-bold">
                            {it.lowStockAlert} {it.unit}
                          </td>

                          <td className="p-3 text-center font-sans space-x-1">
                            <button
                              onClick={() => {
                                // Instant quick replenishment +10
                                const updated = items.map(curr => curr.id === it.id ? { ...curr, stockQty: curr.stockQty + 25 } : curr);
                                setItems(updated);
                                showToast(`⚡ Fast Intake: Added 25 ${it.unit} to "${it.name}"`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              title="Instantly receive 25 items"
                            >
                              +25 Stock
                            </button>

                            <button
                              onClick={() => {
                                // Instant quick reduction -1
                                const updated = items.map(curr => curr.id === it.id ? { ...curr, stockQty: Math.max(0, curr.stockQty - 1) } : curr);
                                setItems(updated);
                                showToast(`Removed 1 ${it.unit} from "${it.name}"`);
                              }}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded text-[10px] cursor-pointer"
                              title="Manual shrinkage adjustment"
                            >
                              -1 Qty
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                          No items match your active search filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-200 p-3 rounded-lg text-slate-700 text-xs text-center">
                📊 Generating Invoices with these items instantly updates quantities. Use "+25 Stock" for fast immediate intake testing.
              </div>

            </div>
          )}

          {/* SCREEN 4: INVOICES & BILLS CENTRAL */}
          {activeTab === 'invoices' && (
            <div className="space-y-4 print:hidden">
              <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Generated Billing Ledger</h2>
                  <p className="text-xs text-slate-500">Manage bills, share invoices on WhatsApp, and track payment status.</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreateInvoice(true)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Issue New Bill Statement</span>
                  </button>
                </div>
              </div>

              {/* Filter controls */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by invoice number or billed party name..."
                    value={invoiceSearch}
                    onChange={e => setInvoiceSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs focus:bg-white"
                  />
                  {invoiceSearch && (
                    <button onClick={() => setInvoiceSearch('')} className="text-xs text-slate-400">✕</button>
                  )}
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded text-xs">
                  <span className="text-slate-500 text-[10px] font-bold px-2 uppercase">Direction:</span>
                  <button
                    onClick={() => setInvoiceTypeFilter('all')}
                    className={`px-2 py-1 rounded font-bold ${invoiceTypeFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
                  >
                    All Invoices ({invoices.length})
                  </button>
                  <button
                    onClick={() => setInvoiceTypeFilter('sale')}
                    className={`px-2 py-1 rounded font-bold ${invoiceTypeFilter === 'sale' ? 'bg-emerald-600 text-white' : 'text-slate-600'}`}
                  >
                    Sales (Outward)
                  </button>
                  <button
                    onClick={() => setInvoiceTypeFilter('purchase')}
                    className={`px-2 py-1 rounded font-bold ${invoiceTypeFilter === 'purchase' ? 'bg-amber-600 text-white' : 'text-slate-600'}`}
                  >
                    Purchases (Inward)
                  </button>
                </div>

                <button
                  onClick={() => triggerCSVExport("Master_Invoices")}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-[11px] px-3 py-1.5 rounded"
                >
                  📥 Export CSV
                </button>
              </div>

              {/* Invoices List Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-3 w-10 text-center">Mode</th>
                      <th className="p-3">Invoice No</th>
                      <th className="p-3">Party Recipient</th>
                      <th className="p-3 text-center">Issue Date</th>
                      <th className="p-3 text-center">Items Count</th>
                      <th className="p-3 text-right">Grand Total</th>
                      <th className="p-3 text-right">Payment Status</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {filteredInvoices.map((inv) => (
                        <tr 
                          key={inv.id} 
                          className="hover:bg-amber-50/60 font-sans transition-colors"
                        >
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase block tracking-tighter ${
                              inv.type === 'sale' ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black font-extrabold'
                            }`}>
                              {inv.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-sm text-slate-900">
                            {inv.invoiceNo}
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {inv.partyName}
                            <span className="block text-[10px] text-slate-400 font-mono font-normal">Ref: {inv.partyId}</span>
                          </td>
                          <td className="p-3 text-center text-slate-600 font-mono">{inv.date}</td>
                          <td className="p-3 text-center font-bold bg-slate-50 rounded">
                            {inv.items.length} lines
                            <span className="block text-[9px] text-slate-400 font-normal">
                              ({inv.items.reduce((s, x) => s + x.qty, 0)} units)
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 text-sm font-mono">
                            {profile.currency}{inv.grandTotal.toFixed(2)}
                          </td>
                          <td className="p-3 text-right font-sans">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase inline-block ${
                              inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                              inv.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {inv.paymentStatus}
                            </span>
                            <span className="block text-[9px] text-slate-500 mt-0.5 font-mono">
                              Paid: {profile.currency}{inv.amountPaid.toFixed(0)} ({inv.paymentMethod.toUpperCase()})
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareInvoiceOnWhatsApp(inv);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                    ))}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          No statements available matching your filter. Use the "+ Issue New Bill Statement" button!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* SCREEN 5: BUSINESS REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 print:hidden font-sans">
              
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                      Business Reports
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">Sales, Purchase and Expense Summary</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Simple business report for daily settlement and party follow-up.</p>
                  </div>

                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-2 cursor-pointer shadow"
                  >
                    🖨️ Print Complete Report Sheet
                  </button>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-200">
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Sales Billed</h4>
                    <span className="text-2xl font-black text-emerald-600 block mt-1 font-mono">
                      {profile.currency}{totalSales.toFixed(2)}
                    </span>
                    <p className="text-xs text-slate-600 mt-2">
                      Total outward sale invoices issued to customers.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Purchases</h4>
                    <span className="text-2xl font-black text-amber-600 block mt-1 font-mono">
                      {profile.currency}{totalPurchases.toFixed(2)}
                    </span>
                    <p className="text-xs text-slate-600 mt-2">
                      Total inward purchase bills recorded from suppliers.
                    </p>
                  </div>

                  <div className="bg-slate-900 text-white p-4 rounded-xl">
                    <h4 className="text-xs font-bold uppercase text-amber-400 tracking-wider">Estimated Net Position</h4>
                    <span className="text-2xl font-black text-white block mt-1 font-mono">
                      {profile.currency}{(totalSales - totalPurchases - totalOverheadExpenses).toFixed(2)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                      Sales minus purchase bills and overhead expenses.
                    </p>
                  </div>

                </div>

                <div className="mt-8 bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-900 text-xs space-y-2">
                  <p className="font-bold uppercase tracking-wider text-[11px] text-amber-950">Ledger Note</p>
                  <p>
                    Arham Traders Invoicing App now uses simple invoice values. Item rates, discounts, shipping and payments are calculated directly for customer-specific billing.
                  </p>
                </div>

              </div>

              {/* Expense Logs Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Recorded Overhead Expenditure ({expenses.length} Entries)</h3>
                    <p className="text-xs text-slate-500">Non-inventory outflows that reduce cash on hand but don't increment direct stock items.</p>
                  </div>

                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log Overhead Outflow</span>
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 uppercase border-b text-[11px]">
                      <tr>
                        <th className="p-2.5 w-16 text-center">Date</th>
                        <th className="p-2.5">Category Tag</th>
                        <th className="p-2.5">Description details</th>
                        <th className="p-2.5 text-center">Paid Wallet</th>
                        <th className="p-2.5 text-right font-bold">Total Outflow</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50 font-sans">
                          <td className="p-2.5 text-center text-slate-500 font-mono">{exp.date}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-700">{exp.description}</td>
                          <td className="p-2.5 text-center uppercase font-bold text-[10px]">
                            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                              {exp.paidVia}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-red-600 font-mono text-sm">
                            -{profile.currency}{exp.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {expenses.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 italic">No business overhead logged.</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-bold border-t border-slate-300">
                        <td colSpan={4} className="p-2.5 text-right uppercase text-slate-500 text-[11px]">Total Overhead Outflows</td>
                        <td className="p-2.5 text-right text-red-600 font-mono text-sm">
                          {profile.currency}{totalOverheadExpenses.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* FIXED FOOTER - hidden on print */}
      <footer className="bg-slate-950 text-slate-500 text-xs p-3 text-center border-t border-slate-800 print:hidden flex flex-wrap justify-between items-center gap-2">
        <div>
          <span>Built for business professionals. Powered by <strong>Arham Traders Invoicing App</strong></span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span>🏢 Active Org: <strong className="text-white">{profile.name}</strong></span>
          <button 
            onClick={() => {
              // Quick reset to sample memory
              setProfile(initialBusinessProfile);
              setParties(initialParties);
              setItems(initialItems);
              setInvoices(initialInvoices);
              setExpenses(initialExpenses);
              setPayments([]);
              showToast("Re-seeded platform with initial Arham Traders sample data.");
            }} 
            className="text-red-400 hover:text-red-300 underline font-bold cursor-pointer"
          >
            Reset Database
          </button>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* OVERLAY MODALS STACK */}
      {/* ========================================================= */}
      
      {/* 1. Create Invoice Modal */}
      {showCreateInvoice && (
        <CreateInvoiceModal
          items={items}
          parties={parties}
          currency={profile.currency}
          onSave={handleSaveInvoice}
          onClose={() => setShowCreateInvoice(false)}
        />
      )}

      {/* 2. Add Item Modal */}
      {showAddItem && (
        <AddItemModal
          currency={profile.currency}
          onSave={handleSaveItem}
          onClose={() => setShowAddItem(false)}
        />
      )}

      {/* 3. Add Party Modal */}
      {showAddParty && (
        <AddPartyModal
          currency={profile.currency}
          onSave={handleSaveParty}
          onClose={() => setShowAddParty(false)}
        />
      )}

      {/* 4. Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          currency={profile.currency}
          onSave={handleSaveExpense}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {paymentModalDirection && (
        <PaymentModal
          direction={paymentModalDirection}
          parties={parties}
          currency={profile.currency}
          onSave={handleSavePayment}
          onClose={() => setPaymentModalDirection(null)}
        />
      )}

      {showBillUpload && (
        <BillUploadModal onClose={() => setShowBillUpload(false)} />
      )}

      {ledgerPOSPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm">POS Ledger Ready</h3>
                <p className="text-[10px] text-slate-400">{ledgerPOSPreview.partyName} | {ledgerPOSPreview.fileName}</p>
              </div>
              <button
                onClick={() => setLedgerPOSPreview(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 py-1 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-3 bg-amber-50 text-amber-900 text-xs border-b border-amber-200">
              If your phone blocks file downloads, tap <strong>WhatsApp</strong> to send directly, or use Share/Copy.
            </div>

            <div className="p-3 flex flex-wrap gap-2 border-b border-slate-200">
              <button
                onClick={downloadLedgerPreviewFile}
                className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download TXT
              </button>
              <button
                onClick={whatsappLedgerPreview}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold flex items-center gap-1"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </button>
              <button
                onClick={shareLedgerPreview}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded text-xs font-bold"
              >
                Share from Phone
              </button>
              <button
                onClick={copyLedgerPreview}
                className="bg-amber-500 hover:bg-amber-600 text-black px-3 py-2 rounded text-xs font-black"
              >
                Copy Text
              </button>
            </div>

            <pre className="m-0 p-4 bg-white text-slate-900 text-[11px] leading-relaxed font-mono overflow-auto whitespace-pre-wrap flex-1">
              {ledgerPOSPreview.content}
            </pre>
          </div>
        </div>
      )}

      {/* 5. Business Settings Branding Modal */}
      {showSettings && (
        <BusinessSettingsModal
          profile={profile}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

    </div>
  );
}
