import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Spinner from '../../components/common/Spinner';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

const VoucherModal = ({ voucher, onClose, onSave }) => {
  const isEdit = !!voucher?.id;
  const [form, setForm] = useState({
    code: voucher?.code || '',
    type: voucher?.type || 'percentage',
    value: voucher?.value || '',
    minOrderAmount: voucher?.minOrderAmount || 0,
    maxDiscountAmount: voucher?.maxDiscountAmount || '',
    usageLimit: voucher?.usageLimit || '',
    startDate: voucher?.startDate?.slice(0, 10) || '',
    endDate: voucher?.endDate?.slice(0, 10) || '',
    isActive: voucher?.isActive !== false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) await api.put(`/vouchers/${voucher.id}`, form);
      else await api.post('/vouchers', form);
      toast.success(isEdit ? 'Voucher updated' : 'Voucher created');
      onSave();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h3 className="font-bold mb-4">{isEdit ? 'Edit Voucher' : 'New Voucher'}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input mt-1">
                <option value="percentage">Percentage %</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
                <option value="flash_sale">Flash Sale</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Value *</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Min Order Amount</label>
              <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Max Discount</label>
              <input type="number" value={form.maxDiscountAmount} onChange={e => setForm(f => ({ ...f, maxDiscountAmount: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Usage Limit</label>
              <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))} className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} required className="input mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} required className="input mt-1" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="accent-primary" />
            Active
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

const VoucherManagement = () => {
  const [modal, setModal] = useState(null);
  const { data, loading, refetch } = useFetch('/vouchers');

  const handleDelete = async (id) => {
    if (!confirm('Delete this voucher?')) return;
    await api.delete(`/vouchers/${id}`);
    toast.success('Voucher deleted');
    refetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1>Voucher Management</h1>
        <button onClick={() => setModal({})} className="btn-primary flex items-center gap-2"><FiPlus /> New Voucher</button>
      </div>
      {loading ? <Spinner /> : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Code', 'Type', 'Value', 'Min Order', 'Usage', 'Valid Until', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {data?.items?.map(v => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{v.code}</td>
                  <td className="px-4 py-3 capitalize">{v.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">{v.type === 'percentage' ? `${v.value}%` : formatCurrency(v.value)}</td>
                  <td className="px-4 py-3">{formatCurrency(v.minOrderAmount)}</td>
                  <td className="px-4 py-3">{v.usedCount}/{v.usageLimit || '∞'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(v.endDate)}</td>
                  <td className="px-4 py-3"><span className={`badge ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{v.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setModal(v)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 size={15} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modal !== null && <VoucherModal voucher={modal} onClose={() => setModal(null)} onSave={() => { setModal(null); refetch(); }} />}
    </div>
  );
};

export default VoucherManagement;
