import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { Rental, Customer, WorkspaceSettings, Equipment } from '../../types';

export type DocumentType =
  | 'contract'
  | 'quote'
  | 'pickup_summary'
  | 'return_summary'
  | 'deposit_receipt'
  | 'payment_receipt';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: DocumentType;
  rental: Rental;
  customer?: Customer;
  settings: WorkspaceSettings;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  documentType,
  rental,
  customer,
  settings,
}) => {
  const { language, t, formatCurrency, formatDate, formatDateTime } = useI18n();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getDocTitle = () => {
    switch (documentType) {
      case 'contract':
        return t.documents.contractTitle;
      case 'quote':
        return t.documents.quoteTitle;
      case 'pickup_summary':
        return t.documents.pickupSummaryTitle;
      case 'return_summary':
        return t.documents.returnSummaryTitle;
      case 'deposit_receipt':
        return t.documents.depositReceiptTitle;
      case 'payment_receipt':
        return t.documents.receiptTitle;
    }
  };

  const isArabic = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Controls (Hidden in print) */}
        <div className="no-print flex items-center justify-between border-b border-stone-200 px-6 py-3.5 bg-stone-100/70">
          <div className="text-xs font-semibold text-stone-700">
            Aperçu de document imprimable / PDF
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
            >
              <Printer className="h-4 w-4" />
              <span>{t.documents.printAction}</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-stone-900 text-xs flex-1 font-sans">
          {/* Header with Company Logo & Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b-2 border-[#1E4D38] pb-6">
            <div>
              <div className="text-xl font-bold tracking-tight text-[#1E4D38] uppercase">
                {settings.businessName}
              </div>
              <div className="text-stone-600 mt-1">{settings.businessType}</div>
              <div className="text-stone-500 mt-0.5">{settings.address}, {settings.city} (Maroc)</div>
              <div className="text-stone-500 mt-0.5">
                Tél: {settings.phone} {settings.whatsapp && `· WhatsApp: ${settings.whatsapp}`}
              </div>
              <div className="text-stone-500 mt-0.5">Email: {settings.email}</div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                {getDocTitle()}
              </div>
              <div className="text-stone-600 font-semibold mt-1">
                Réf : {rental.referenceNumber}
              </div>
              <div className="text-stone-500 mt-0.5">
                Date d'émission : {formatDate(new Date().toISOString())}
              </div>
              <div className="text-stone-500 mt-0.5">
                Devise : {settings.currency} (Dirham marocain)
              </div>
            </div>
          </div>

          {/* Parties: Loueur & Locataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 p-4 rounded-lg bg-stone-50/70 border border-stone-200/80">
            <div>
              <div className="font-bold text-[#1E4D38] uppercase tracking-wider text-[11px] mb-1">
                {t.documents.lessor}
              </div>
              <div className="font-semibold text-stone-900">{settings.businessName}</div>
              <div className="text-stone-600 mt-0.5">{settings.address}, {settings.city}</div>
              <div className="text-stone-600 mt-0.5">RC / ICE : Registre du Commerce Casablanca</div>
            </div>

            <div>
              <div className="font-bold text-[#1E4D38] uppercase tracking-wider text-[11px] mb-1">
                {t.documents.lessee}
              </div>
              <div className="font-semibold text-stone-900">{customer?.name || 'Client'}</div>
              {customer?.companyName && (
                <div className="text-stone-700 font-medium">{customer.companyName}</div>
              )}
              {customer?.cinOrIce && (
                <div className="text-stone-600 mt-0.5">{customer.cinOrIce}</div>
              )}
              <div className="text-stone-600 mt-0.5">{customer?.phone}</div>
              <div className="text-stone-600 mt-0.5">{customer?.address}</div>
            </div>
          </div>

          {/* Period Details */}
          <div className="mb-6 p-3 rounded-lg border border-stone-200 text-stone-700 flex flex-col sm:flex-row justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-stone-900">Mise à disposition (Départ) :</span>{' '}
              {formatDateTime(rental.startDate)}
            </div>
            <div>
              <span className="font-semibold text-stone-900">Restitution convenue :</span>{' '}
              {formatDateTime(rental.endDate)}
            </div>
            <div>
              <span className="font-semibold text-stone-900">Lieu :</span>{' '}
              {rental.deliveryType === 'delivery'
                ? `Livraison sur site : ${rental.deliveryAddress}`
                : 'Enlèvement au dépôt agence'}
            </div>
          </div>

          {/* Itemized Equipment Table */}
          <div className="mb-6 border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 text-[11px]">
                <tr>
                  <th className="p-3">Désignation de l'équipement</th>
                  <th className="p-3 text-center">Qté</th>
                  <th className="p-3 text-right">Tarif unitaire</th>
                  <th className="p-3 text-center">Unité</th>
                  <th className="p-3 text-right">Total HT</th>
                  <th className="p-3 text-right">Caution exigée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {rental.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="p-3">
                      <div className="font-semibold text-stone-900">{line.equipmentName}</div>
                      {line.assignedUnitIds && line.assignedUnitIds.length > 0 && (
                        <div className="text-[10px] text-stone-500">
                          Numéros d'actifs : {line.assignedUnitIds.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-medium">{line.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(line.rateApplied)}</td>
                    <td className="p-3 text-center text-stone-500">
                      {line.billableUnitsCount} j
                    </td>
                    <td className="p-3 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                    <td className="p-3 text-right text-stone-600">
                      {formatCurrency(line.lineDepositTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total HT :</span>
                <span className="font-semibold text-stone-900">
                  {formatCurrency(rental.lines.reduce((s, l) => s + l.lineTotal, 0))}
                </span>
              </div>
              {rental.deliveryFee > 0 && (
                <div className="flex justify-between text-stone-600">
                  <span>Frais de livraison :</span>
                  <span>{formatCurrency(rental.deliveryFee)}</span>
                </div>
              )}
              {rental.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Remise accordée :</span>
                  <span>-{formatCurrency(rental.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>TVA ({rental.taxRate}%) :</span>
                <span>{formatCurrency(rental.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-bold text-stone-900">
                <span>Total Location TTC :</span>
                <span className="text-[#1E4D38]">{formatCurrency(rental.rentalTotal)}</span>
              </div>
              <div className="pt-1 border-t border-dashed border-amber-300 flex justify-between text-xs font-bold text-amber-900">
                <span>Caution de garantie exigible :</span>
                <span>{formatCurrency(rental.depositRequired)}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions (Moroccan jurisdiction) */}
          <div className="mb-8 p-4 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-600 space-y-2">
            <div className="font-bold text-stone-800 uppercase tracking-wider text-[10px]">
              Conditions générales de location
            </div>
            <p>{isArabic ? settings.contractTermsAr : settings.contractTermsFr}</p>
            {isArabic && (
              <p className="font-arabic text-stone-700 pt-1 border-t border-stone-200/60" dir="rtl">
                {settings.contractTermsAr}
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-stone-200 text-xs">
            <div>
              <div className="font-semibold text-stone-900 mb-1">{t.documents.lessorSignature}</div>
              <div className="text-[10px] text-stone-500 mb-12">Cachet et signature de l'entreprise</div>
              <div className="border-b border-stone-300 w-48" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-stone-900 mb-1">{t.documents.lesseeSignature}</div>
              <div className="text-[10px] text-stone-500 mb-12">Mention manuscrite "Lu et approuvé"</div>
              <div className="border-b border-stone-300 w-48 ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
