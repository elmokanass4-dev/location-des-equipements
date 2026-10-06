import React, { useState } from 'react';
import {
  Settings,
  Building,
  Sliders,
  CreditCard,
  Database,
  CheckCircle2,
  RefreshCw,
  Download,
  Shield,
  Clock,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { WorkspaceSettings, WorkspaceLocation } from '../../types';

interface SettingsViewProps {
  settings: WorkspaceSettings;
  locations: WorkspaceLocation[];
  onSaveSettings: (settings: WorkspaceSettings) => void;
  onResetDemoData: () => void;
  onExportJson: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  locations,
  onSaveSettings,
  onResetDemoData,
  onExportJson,
}) => {
  const { t, formatCurrency } = useI18n();

  const [activeTab, setActiveTab] = useState<'general' | 'rules' | 'subscription' | 'data'>('general');

  // Form states
  const [businessName, setBusinessName] = useState(settings.businessName);
  const [businessType, setBusinessType] = useState(settings.businessType);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [city, setCity] = useState(settings.city);
  const [currency, setCurrency] = useState(settings.currency);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [taxEnabled, setTaxEnabled] = useState(settings.taxEnabled);
  const [turnaroundBufferHours, setTurnaroundBufferHours] = useState(settings.turnaroundBufferHours);
  const [defaultDepositPercentage, setDefaultDepositPercentage] = useState(settings.defaultDepositPercentage);
  const [contractTermsFr, setContractTermsFr] = useState(settings.contractTermsFr);
  const [contractTermsAr, setContractTermsAr] = useState(settings.contractTermsAr);
  const [subscriptionPlan, setSubscriptionPlan] = useState(settings.subscriptionPlan);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: WorkspaceSettings = {
      ...settings,
      businessName,
      businessType,
      phone,
      whatsapp,
      email,
      address,
      city,
      currency,
      timezone,
      taxRate,
      taxEnabled,
      turnaroundBufferHours,
      defaultDepositPercentage,
      contractTermsFr,
      contractTermsAr,
      subscriptionPlan,
    };

    onSaveSettings(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.settings.title}</h1>
          <p className="text-xs text-stone-500">{t.settings.subtitle}</p>
        </div>

        {isSavedNotice && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
            <span>Paramètres enregistrés !</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200">
        <nav className="flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.settings.generalTab}
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'rules'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.settings.rulesTab}
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'subscription'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.settings.subscriptionTab}
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'data'
                ? 'border-[#1E4D38] text-[#1E4D38]'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {t.settings.dataTab}
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tab 1: General Profile */}
        {activeTab === 'general' && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
            <h2 className="font-bold text-sm text-stone-900">Identité commerciale de l'entreprise</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.settings.businessName}</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Secteur / Activité</label>
                <input
                  type="text"
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.settings.businessPhone}</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">WhatsApp professionnel</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.settings.businessEmail}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Ville et Pays</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded border border-stone-200 p-2 text-xs"
                  />
                  <input
                    type="text"
                    disabled
                    value="Maroc"
                    className="w-full rounded border border-stone-200 p-2 text-xs bg-stone-100 text-stone-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-stone-700 mb-1">Adresse complète</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>
            </div>

            {/* Dépôts existants */}
            <div className="pt-4 border-t border-stone-100">
              <span className="font-bold text-stone-800">Dépôts & Agences d'inventaire ({locations.length})</span>
              <div className="mt-2 space-y-2">
                {locations.map((loc) => (
                  <div key={loc.id} className="p-3 rounded-lg border border-stone-100 bg-stone-50/50 flex justify-between">
                    <div>
                      <div className="font-semibold text-stone-900">
                        {loc.name} {loc.isPrimary && '· Principal'}
                      </div>
                      <div className="text-[11px] text-stone-500">{loc.address}, {loc.city}</div>
                    </div>
                    <div className="text-stone-600 font-mono text-[11px]">{loc.phone}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Rules & Buffers */}
        {activeTab === 'rules' && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
            <h2 className="font-bold text-sm text-stone-900">Règles d'exploitation & Délais tampons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {t.settings.turnaroundBuffer}
                </label>
                <input
                  type="number"
                  min="0"
                  max="48"
                  value={turnaroundBufferHours}
                  onChange={(e) => setTurnaroundBufferHours(parseInt(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
                <span className="text-[10px] text-stone-500">
                  Délai de contrôle, nettoyage et préparation requis entre deux locations successives.
                </span>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  {t.settings.depositDefault}
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={defaultDepositPercentage}
                  onChange={(e) => setDefaultDepositPercentage(parseInt(e.target.value) || 25)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">{t.settings.taxRate}</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    className="rounded text-[#1E4D38]"
                  />
                  <span>{t.settings.taxEnabled}</span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-stone-700 mb-1">
                  Conditions générales contractuelles (Français)
                </label>
                <textarea
                  rows={3}
                  value={contractTermsFr}
                  onChange={(e) => setContractTermsFr(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs"
                />
              </div>

              <div className="sm:col-span-2" dir="rtl">
                <label className="block font-medium text-stone-700 mb-1 font-arabic">
                  الشروط العامة لعقد الكراء (العربية)
                </label>
                <textarea
                  rows={3}
                  value={contractTermsAr}
                  onChange={(e) => setContractTermsAr(e.target.value)}
                  className="w-full rounded border border-stone-200 p-2 text-xs font-arabic"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Subscription Plans */}
        {activeTab === 'subscription' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-amber-900 flex items-start gap-2.5">
              <CreditCard className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">{t.settings.billingStatus}</span>
                <p className="text-[11px] mt-0.5">
                  Aucun prélèvement réel n'est effectué. Les plans ci-dessous permettent de modéliser les plafonds fonctionnels (dépôts, utilisateurs, accès au catalogue public).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Starter Plan */}
              <div
                onClick={() => setSubscriptionPlan('starter')}
                className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  subscriptionPlan === 'starter'
                    ? 'border-[#1E4D38] bg-white ring-2 ring-[#1E4D38]/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-stone-400 uppercase">Starter</div>
                  <div className="text-2xl font-bold text-stone-900 mt-1">299 MAD</div>
                  <div className="text-stone-500 text-[10px]">par mois</div>
                  <ul className="mt-4 space-y-2 text-stone-700 text-[11px]">
                    <li>✓ 1 Dépôt d'équipement</li>
                    <li>✓ 2 Postes utilisateurs</li>
                    <li>✓ Jusqu'à 50 équipements</li>
                    <li>✓ Bons de sortie & retours</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100">
                  <span className={`font-semibold ${subscriptionPlan === 'starter' ? 'text-[#1E4D38]' : 'text-stone-400'}`}>
                    {subscriptionPlan === 'starter' ? '● Formule active' : 'Sélectionner'}
                  </span>
                </div>
              </div>

              {/* Pro Plan */}
              <div
                onClick={() => setSubscriptionPlan('pro')}
                className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  subscriptionPlan === 'pro'
                    ? 'border-[#1E4D38] bg-white ring-2 ring-[#1E4D38]/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase">Recommandé · Pro</div>
                  <div className="text-2xl font-bold text-stone-900 mt-1">499 MAD</div>
                  <div className="text-stone-500 text-[10px]">par mois</div>
                  <ul className="mt-4 space-y-2 text-stone-700 text-[11px]">
                    <li>✓ Jusqu'à 3 Dépôts / Agences</li>
                    <li>✓ 8 Postes collaborateurs</li>
                    <li>✓ Vitrine Catalogue Public en ligne</li>
                    <li>✓ Module Cautions & Maintenance</li>
                    <li>✓ Équipements illimités</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100">
                  <span className={`font-semibold ${subscriptionPlan === 'pro' ? 'text-[#1E4D38]' : 'text-stone-400'}`}>
                    {subscriptionPlan === 'pro' ? '● Formule active' : 'Sélectionner'}
                  </span>
                </div>
              </div>

              {/* Business Plan */}
              <div
                onClick={() => setSubscriptionPlan('business')}
                className={`cursor-pointer rounded-xl border p-5 transition-all flex flex-col justify-between ${
                  subscriptionPlan === 'business'
                    ? 'border-[#1E4D38] bg-white ring-2 ring-[#1E4D38]/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div>
                  <div className="text-[11px] font-semibold text-stone-400 uppercase">Business Enterprise</div>
                  <div className="text-2xl font-bold text-stone-900 mt-1">799 MAD</div>
                  <div className="text-stone-500 text-[10px]">par mois</div>
                  <ul className="mt-4 space-y-2 text-stone-700 text-[11px]">
                    <li>✓ Dépôts illimités dans tout le Maroc</li>
                    <li>✓ Utilisateurs illimités</li>
                    <li>✓ Export comptable automatisé</li>
                    <li>✓ API & Intégrations sur mesure</li>
                    <li>✓ Support téléphonique prioritaire</li>
                  </ul>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100">
                  <span className={`font-semibold ${subscriptionPlan === 'business' ? 'text-[#1E4D38]' : 'text-stone-400'}`}>
                    {subscriptionPlan === 'business' ? '● Formule active' : 'Sélectionner'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Data & Reset */}
        {activeTab === 'data' && (
          <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 text-xs">
            <h2 className="font-bold text-sm text-stone-900">Sauvegarde & Restauration de l'espace</h2>
            <p className="text-stone-600 leading-relaxed">
              Toutes les opérations réalisées dans Kriya sont sauvegardées localement dans votre navigateur. Vous pouvez exporter une sauvegarde intégrale sous format JSON ou réinitialiser le jeu de données d'exemple marocain.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={onExportJson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3.5 py-2 font-semibold text-stone-800 hover:bg-stone-50 shadow-2xs"
              >
                <Download className="h-4 w-4 text-stone-500" />
                <span>{t.settings.exportJson}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Voulez-vous réinitialiser toutes les données avec les exemples marocains par défaut ?')) {
                    onResetDemoData();
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3.5 py-2 font-semibold text-red-800 hover:bg-red-100 shadow-2xs"
              >
                <RefreshCw className="h-4 w-4 text-red-600" />
                <span>{t.settings.resetData}</span>
              </button>
            </div>
          </div>
        )}

        {/* Save Changes button */}
        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="submit"
            className="rounded-lg bg-[#1E4D38] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B]"
          >
            {t.settings.saveChanges}
          </button>
        </div>
      </form>
    </div>
  );
};
