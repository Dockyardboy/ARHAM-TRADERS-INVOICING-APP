import React, { useState } from 'react';
import { BusinessProfile } from '../types';
import { X, Check, Building2, RefreshCw } from 'lucide-react';
import { initialBusinessProfile } from '../initialData';

interface BusinessSettingsModalProps {
  profile: BusinessProfile;
  onSave: (profile: BusinessProfile) => void;
  onClose: () => void;
}

export const BusinessSettingsModal: React.FC<BusinessSettingsModalProps> = ({
  profile,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<BusinessProfile>({ ...profile });

  const handleChange = (field: keyof BusinessProfile, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLogoUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormData({ ...formData, logoUrl: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    setFormData({ ...initialBusinessProfile });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-bold text-base">My Business Profile & Print Branding</h3>
              <p className="text-[10px] text-slate-400">Settings update dynamically across all generated invoices & bills</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-slate-800 text-xs font-sans">
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-bold block text-slate-700">Restore Original Arham Traders Demo Configuration</span>
              <span className="text-[10px] text-slate-500">Reset values back to standard fully loaded defaults.</span>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-red-600" />
              <span>Reset Profile</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Company / Enterprise Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 font-bold text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Tagline / Business Purpose</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={e => handleChange('tagline', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="block font-bold uppercase text-slate-600 mb-1">Upload Business Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleLogoUpload(e.target.files?.[0])}
                className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, SVG or camera image. Stored inside the current app session.</p>
            </div>
            <div className="flex items-center justify-center rounded border border-slate-200 bg-white min-h-24 p-2">
              <img src={formData.logoUrl || '/arham-logo.svg'} alt="Logo preview" className="max-h-20 max-w-full object-contain" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Currency Symbol</label>
              <select
                value={formData.currency}
                onChange={e => handleChange('currency', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-bold font-mono text-red-600 bg-red-50"
              >
                <option value="₹">₹ Indian Rupee (INR)</option>
                <option value="$">$ US Dollar (USD)</option>
                <option value="€">€ Euro (EUR)</option>
                <option value="£">£ British Pound (GBP)</option>
                <option value="A$">A$ Australian Dollar</option>
                <option value="C$">C$ Canadian Dollar</option>
                <option value="¥">¥ Japanese Yen</option>
                <option value="AED ">AED UAE Dirham</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Official Mobile / Call Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={e => handleChange('phone', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => handleChange('email', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-600 mb-1">GSTIN / Business Reference ID (Optional)</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={e => handleChange('gstin', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-2 font-mono uppercase text-xs font-bold"
                placeholder="GSTIN or business registration number"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Primary Headquarters Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs leading-tight"
              />
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-200 space-y-3">
            <h4 className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider">
              Bank & Digital Transfer Parameters (Auto-rendered on printed footers)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">BHIM UPI Handler ID</label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={e => handleChange('upiId', e.target.value)}
                  placeholder="name@okaxis"
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bankAccount}
                  onChange={e => handleChange('bankAccount', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => handleChange('ifscCode', e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">Terms, Policy & Jurisdiction Notes</label>
            <textarea
              rows={3}
              value={formData.termsAndConditions}
              onChange={e => handleChange('termsAndConditions', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono leading-relaxed text-slate-700"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-slate-600 hover:bg-slate-100 cursor-pointer text-xs font-bold"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded flex items-center gap-2 cursor-pointer text-xs shadow"
            >
              <Check className="w-4 h-4" />
              <span>Confirm & Apply Business Branding</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
