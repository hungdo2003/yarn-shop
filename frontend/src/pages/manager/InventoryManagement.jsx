import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiArrowUp, FiSettings } from 'react-icons/fi';

const InventoryManagement = () => {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('products');
  const [importModal, setImportModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const { data, loading, refetch } = useFetch('/inventory', { page });
  const { data: materials, refetch: refetchMaterials } = useFetch('/inventory/materials');

  const handleImport = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post('/inventory/import', { productId: importModal.id, quantity: parseInt(fd.get('quantity')), note: fd.get('note') });
    toast.success('Stock imported');
    setImportModal(null);
    refetch();
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post('/inventory/adjust', { productId: adjustModal.id, newQuantity: parseInt(fd.get('quantity')), note: fd.get('note') });
    toast.success('Stock adjusted');
    setAdjustModal(null);
    refetch();
  };

  return (
    <div className="p-6">
      <h1 className="mb-6">Inventory Management</h1>
      <div className="flex gap-3 mb-6">
        {[['products', 'Products Stock'], ['materials', 'Raw Materials']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        loading ? <Spinner /> : (
          <div className="card overflow-hidden p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Product', 'Code', 'In Stock', 'Min Level', 'Last Restock', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y">
                {data?.items?.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.code}</td>
                    <td className="px-4 py-3">
                      <span className={`font-bold ${p.Inventory?.quantity <= p.Inventory?.minStockLevel ? 'text-red-600' : 'text-gray-900'}`}>
                        {p.Inventory?.quantity || 0}
                      </span>
                      {p.Inventory?.quantity <= p.Inventory?.minStockLevel && <span className="badge bg-red-100 text-red-600 ml-2 text-xs">Low</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.Inventory?.minStockLevel}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.Inventory?.lastRestockedAt ? new Date(p.Inventory.lastRestockedAt).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setImportModal(p)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Import Stock"><FiArrowUp size={15} /></button>
                        <button onClick={() => setAdjustModal(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Adjust"><FiSettings size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'materials' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>{['Material', 'Unit', 'Stock', 'Cost/Unit'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y">
              {(materials || []).map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-500">{m.unit}</td>
                  <td className="px-4 py-3"><span className={`font-bold ${m.stock < 100 ? 'text-red-600' : ''}`}>{m.stock}</span></td>
                  <td className="px-4 py-3 text-gray-500">{m.costPerUnit ? `${m.costPerUnit} VND` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination pagination={data?.pagination} onPageChange={setPage} />

      {importModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleImport} className="bg-white rounded-2xl w-80 p-6 space-y-4">
            <h3 className="font-bold">Import Stock: {importModal.name}</h3>
            <div><label className="text-sm font-medium">Quantity *</label><input name="quantity" type="number" min="1" required className="input mt-1" /></div>
            <div><label className="text-sm font-medium">Note</label><input name="note" className="input mt-1" /></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setImportModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Import</button>
            </div>
          </form>
        </div>
      )}

      {adjustModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAdjust} className="bg-white rounded-2xl w-80 p-6 space-y-4">
            <h3 className="font-bold">Adjust Stock: {adjustModal.name}</h3>
            <p className="text-sm text-gray-500">Current: {adjustModal.Inventory?.quantity}</p>
            <div><label className="text-sm font-medium">New Quantity *</label><input name="quantity" type="number" min="0" required defaultValue={adjustModal.Inventory?.quantity} className="input mt-1" /></div>
            <div><label className="text-sm font-medium">Reason</label><input name="note" required className="input mt-1" /></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setAdjustModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">Adjust</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
