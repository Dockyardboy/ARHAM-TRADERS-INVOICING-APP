import React, { useMemo, useState } from 'react';
import { Camera, Copy, FileImage, Loader2, X } from 'lucide-react';
import { createWorker } from 'tesseract.js';

interface BillUploadModalProps {
  onClose: () => void;
}

interface ExtractedBillFields {
  billNumber: string | null;
  billDate: string | null;
  partyName: string | null;
  phone: string | null;
  totalAmount: string | null;
  paymentAmount: string | null;
  rawText: string;
}

const normalizeDate = (value: string): string | null => {
  const clean = value.trim();
  const parts = clean.match(/^(\d{1,4})[\-/\.](\d{1,2})[\-/\.](\d{1,4})$/);
  if (!parts) return null;

  let first = Number(parts[1]);
  const month = Number(parts[2]);
  let third = Number(parts[3]);
  if (month < 1 || month > 12) return null;

  let year: number;
  let day: number;
  if (parts[1].length === 4) {
    year = first;
    day = third;
  } else {
    day = first;
    year = third;
  }

  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || year < 1900) return null;
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const normalizeAmount = (value: string): string | null => {
  const cleaned = value.replace(/[$€£₹,\s]/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  return cleaned;
};

const getLabeledValue = (rawText: string, labels: string[]) => {
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(`^${label}\\s*[:#-]?\\s*(.+)$`, 'i');
      const match = line.match(regex);
      if (match?.[1]?.trim()) return match[1].trim();
    }
  }
  return null;
};

const extractFields = (rawText: string): ExtractedBillFields => {
  const billNumber = getLabeledValue(rawText, ['bill no', 'bill number', 'invoice no', 'invoice number', 'inv no']);
  const dateCandidate = getLabeledValue(rawText, ['date', 'bill date', 'invoice date'])
    || rawText.match(/\b\d{1,4}[\-/\.]\d{1,2}[\-/\.]\d{1,4}\b/)?.[0]
    || null;
  const partyName = getLabeledValue(rawText, ['party', 'customer', 'name', 'bill to', 'supplier']);
  const phone = rawText.match(/\b(?:\+?91[-\s]?)?[6-9]\d{9}\b/)?.[0] || null;
  const totalCandidate = getLabeledValue(rawText, ['grand total', 'total amount', 'net amount', 'total']);
  const paymentCandidate = getLabeledValue(rawText, ['payment', 'paid', 'amount paid', 'received']);

  return {
    billNumber: billNumber || null,
    billDate: dateCandidate ? normalizeDate(dateCandidate) : null,
    partyName: partyName || null,
    phone,
    totalAmount: totalCandidate ? normalizeAmount(totalCandidate) : null,
    paymentAmount: paymentCandidate ? normalizeAmount(paymentCandidate) : null,
    rawText
  };
};

export const BillUploadModal: React.FC<BillUploadModalProps> = ({ onClose }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [status, setStatus] = useState('Upload or capture a clear bill photo.');
  const [isReading, setIsReading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedBillFields | null>(null);

  const extractedJson = useMemo(() => extracted ? JSON.stringify(extracted, null, 2) : '', [extracted]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setExtracted(null);
    setIsReading(true);
    setStatus('Reading bill text. Please keep this screen open.');

    try {
      const worker = await createWorker('eng');
      const result = await worker.recognize(file);
      await worker.terminate();
      const rawText = result.data.text.trim();
      setExtracted(extractFields(rawText));
      setStatus('Extraction completed. Unreadable or missing fields are returned as null.');
    } catch (error) {
      console.error(error);
      setStatus('Could not read this image. Try a clearer photo with good lighting.');
      setExtracted({
        billNumber: null,
        billDate: null,
        partyName: null,
        phone: null,
        totalAmount: null,
        paymentAmount: null,
        rawText: ''
      });
    } finally {
      setIsReading(false);
    }
  };

  const copyOutput = async () => {
    if (!extractedJson) return;
    await navigator.clipboard.writeText(extractedJson);
    setStatus('Extracted bill JSON copied.');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 print:hidden">
      <div className="holo-panel bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col">
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wide">Upload Bill Through Camera or Photo</h3>
            <p className="text-[10px] text-slate-400">OCR extracts exact visible text. Missing or unreadable fields remain null.</p>
          </div>
          <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 text-white rounded px-2 py-1 text-xs font-bold">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto">
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="bg-slate-900 border border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:shadow-lg">
                <Camera className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <span className="block text-xs font-bold">Open Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e => handleFile(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
              <label className="bg-slate-900 border border-slate-200 rounded-lg p-3 text-center cursor-pointer hover:shadow-lg">
                <FileImage className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                <span className="block text-xs font-bold">Choose Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFile(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
            </div>

            <div className="border border-slate-200 rounded-lg min-h-64 flex items-center justify-center bg-slate-950 overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Uploaded bill" className="max-h-80 w-full object-contain" />
              ) : (
                <p className="text-xs text-slate-400 text-center p-6">No bill image selected.</p>
              )}
            </div>

            <div className="text-xs text-slate-400 bg-slate-900 border border-slate-200 rounded p-3">
              <p className="font-bold text-blue-600 mb-1">Extraction Rules</p>
              <p>1. Text is extracted only from the uploaded image.</p>
              <p>2. Missing or unreadable fields are returned as null.</p>
              <p>3. Dates are normalized to YYYY-MM-DD where readable.</p>
              <p>4. Currency symbols are removed from amounts.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-200 rounded-lg p-3 text-xs flex items-center justify-between gap-2">
              <span>{status}</span>
              {isReading && <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />}
            </div>

            <div className="bg-slate-950 border border-slate-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-blue-600">Extracted Fields</h4>
                <button
                  onClick={copyOutput}
                  disabled={!extracted}
                  className="bg-slate-900 text-white border border-slate-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 disabled:opacity-40"
                >
                  <Copy className="w-3 h-3" />
                  Copy JSON
                </button>
              </div>
              <pre className="text-[11px] whitespace-pre-wrap overflow-auto max-h-80 font-mono text-slate-300">
                {extractedJson || '{\n  "billNumber": null,\n  "billDate": null,\n  "partyName": null,\n  "phone": null,\n  "totalAmount": null,\n  "paymentAmount": null,\n  "rawText": ""\n}'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};