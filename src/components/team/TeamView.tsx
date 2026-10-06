import React, { useState } from 'react';
import {
  UserCheck,
  Shield,
  CheckCircle2,
  XCircle,
  Plus,
  User as UserIcon,
  Crown,
  Briefcase,
  Calculator,
} from 'lucide-react';
import { useI18n } from '../../i18n/context';
import { User, UserRole } from '../../types';
import { Modal } from '../common/Modal';

interface TeamViewProps {
  users: User[];
  activeUser: User;
  onSelectActiveUser: (u: User) => void;
  onAddUser: (u: User) => void;
}

export const TeamView: React.FC<TeamViewProps> = ({
  users,
  activeUser,
  onSelectActiveUser,
  onAddUser,
}) => {
  const { t } = useI18n();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');

  const permissionsMatrix = [
    {
      action: 'Créer des réservations et devis',
      owner: true,
      manager: true,
      staff: true,
      accountant: false,
    },
    {
      action: 'Valider les bons de sortie (Mise à disposition)',
      owner: true,
      manager: true,
      staff: true,
      accountant: false,
    },
    {
      action: 'Valider les retours & enregistrer les dégâts',
      owner: true,
      manager: true,
      staff: true,
      accountant: false,
    },
    {
      action: 'Encaisser les règlements de location',
      owner: true,
      manager: true,
      staff: true,
      accountant: true,
    },
    {
      action: 'Émettre des remboursements ou retenues sur caution',
      owner: true,
      manager: true,
      staff: false,
      accountant: true,
    },
    {
      action: 'Créer / modifier les équipements et tarifs',
      owner: true,
      manager: true,
      staff: false,
      accountant: false,
    },
    {
      action: 'Exporter les bilans comptables & rapports financiers',
      owner: true,
      manager: true,
      staff: false,
      accountant: true,
    },
    {
      action: 'Gérer l’abonnement, les dépôts et les paramètres société',
      owner: true,
      manager: false,
      staff: false,
      accountant: false,
    },
  ];

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const u: User = {
      id: `usr-${Date.now()}`,
      name: newName,
      email: newEmail,
      role: newRole,
    };

    onAddUser(u);
    setIsAddModalOpen(false);
    setNewName('');
    setNewEmail('');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-amber-600" />;
      case 'manager':
        return <Briefcase className="h-4 w-4 text-[#1E4D38]" />;
      case 'accountant':
        return <Calculator className="h-4 w-4 text-blue-600" />;
      case 'staff':
        return <UserIcon className="h-4 w-4 text-stone-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-900 tracking-tight">{t.team.title}</h1>
          <p className="text-xs text-stone-500">{t.team.subtitle}</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E4D38] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#163B2B] self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Inviter un collaborateur</span>
        </button>
      </div>

      {/* Active Persona Switcher Card */}
      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-3">
        <div className="text-xs font-semibold text-stone-900">
          {t.team.simulateRoleSwitch}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {users.map((u) => (
            <div
              key={u.id}
              onClick={() => onSelectActiveUser(u)}
              className={`cursor-pointer p-3.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                activeUser.id === u.id
                  ? 'border-[#1E4D38] bg-white shadow-xs'
                  : 'border-stone-200 bg-white/70 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-stone-100">{getRoleIcon(u.role)}</div>
                <div>
                  <div className="font-semibold text-stone-900">{u.name}</div>
                  <div className="text-[10px] text-stone-500 capitalize">{u.role}</div>
                </div>
              </div>
              {activeUser.id === u.id && (
                <span className="text-[10px] font-bold text-[#1E4D38] bg-emerald-50 px-2 py-0.5 rounded">
                  Actif
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-2xs space-y-3 text-xs">
        <div>
          <h2 className="font-bold text-sm text-stone-900">{t.team.permissionsMatrix}</h2>
          <p className="text-stone-500 text-[11px] mt-0.5">
            Règles d'habilitation applicables aux opérations sensibles
          </p>
        </div>

        <div className="rounded-lg border border-stone-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold text-[11px]">
              <tr>
                <th className="p-3">Opération métier</th>
                <th className="p-3 text-center">Owner (Propriétaire)</th>
                <th className="p-3 text-center">Manager</th>
                <th className="p-3 text-center">Staff (Comptoir)</th>
                <th className="p-3 text-center">Accountant (Comptable)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-stone-50/50">
                  <td className="p-3 font-medium text-stone-800">{row.action}</td>
                  <td className="p-3 text-center">
                    {row.owner ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-stone-300 inline" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.manager ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-stone-300 inline" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.staff ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-stone-300 inline" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.accountant ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-stone-300 inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Inviter un collaborateur"
          subtitle="Définissez son rôle et son niveau d'accès au logiciel"
          maxWidth="md"
        >
          <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-stone-700 mb-1">Nom complet *</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex. Reda Bennis"
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Email professionnel *</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="reda@atlaslocation.ma"
                className="w-full rounded border border-stone-200 p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-stone-700 mb-1">Rôle attribué</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full rounded border border-stone-200 p-2 text-xs bg-white"
              >
                <option value="staff">{t.team.roleStaff}</option>
                <option value="manager">{t.team.roleManager}</option>
                <option value="accountant">{t.team.roleAccountant}</option>
                <option value="owner">{t.team.roleOwner}</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3 py-1.5 rounded border border-stone-200 text-stone-700"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-[#1E4D38] text-white font-semibold"
              >
                Créer le compte
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
