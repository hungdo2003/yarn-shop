import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiEdit2, FiUserX } from 'react-icons/fi';

const EditModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({ fullName: user.fullName, phone: user.phone || '', roleId: user.roleId, isActive: user.isActive });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/users/${user.id}`, form);
      toast.success('User updated');
      onSave();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-80 p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold mb-4">Edit User: {user.fullName}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="text-sm font-medium">Full Name</label><input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="input mt-1 text-base" /></div>
          <div><label className="text-sm font-medium">Phone</label><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input mt-1 text-base" /></div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: parseInt(e.target.value) }))} className="input mt-1 text-base">
              <option value={1}>Admin</option>
              <option value={2}>Customer</option>
              <option value={3}>Staff</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
            Active Account
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleId, setRoleId] = useState('');
  const [modal, setModal] = useState(null);
  const { data, loading, refetch } = useFetch('/users', { page, search, roleId });

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    toast.success('User deactivated');
    refetch();
  };

  const ROLE_LABELS = { 1: 'Admin', 2: 'Customer', 3: 'Staff' };
  const ROLE_COLORS = { admin: 'bg-red-100 text-red-700', customer: 'bg-blue-100 text-blue-700', staff: 'bg-purple-100 text-purple-700' };

  return (
    <div className="p-6">
      <h1 className="mb-6">User Management</h1>
      <div className="card mb-4 flex flex-col sm:flex-row gap-3">
        <input placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input flex-1 text-base" />
        <select value={roleId} onChange={e => { setRoleId(e.target.value); setPage(1); }} className="border border-gray-300 rounded-lg px-3 py-2 text-base">
          <option value="">All Roles</option>
          <option value="1">Admin</option>
          <option value="2">Customer</option>
          <option value="3">Staff</option>
        </select>
      </div>
      {loading ? <Spinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{[
                ['User', ''], ['Email', 'hidden md:table-cell'], ['Phone', 'hidden sm:table-cell'],
                ['Role', ''], ['Status', ''], ['Joined', 'hidden md:table-cell'], ['Actions', '']
              ].map(([h, cls]) => (
                <th key={h} className={`text-left px-4 py-3 font-semibold text-gray-600 ${cls}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {data?.items?.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                        {u.fullName?.[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.phone || '-'}</td>
                  <td className="px-4 py-3"><span className={`badge ${ROLE_COLORS[u.Role?.name]}`}>{u.Role?.name}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(u)} className="w-11 h-11 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                      {u.isActive && <button onClick={() => handleDeactivate(u.id)} className="w-11 h-11 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"><FiUserX size={15} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination pagination={data?.pagination} onPageChange={setPage} />
      {modal && <EditModal user={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); refetch(); }} />}
    </div>
  );
};

export default UserManagement;
