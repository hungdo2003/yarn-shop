import { useState } from 'react';
import useFetch from '../../hooks/useFetch';
import api from '../../services/api';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';
import { FiArrowUp, FiSettings, FiAlertTriangle, FiSearch } from 'react-icons/fi';

const TX_TYPE = {
  import:     { label: 'Nhập hàng',    color: 'bg-green-100 text-green-700',  icon: '📦' },
  adjustment: { label: 'Điều chỉnh',   color: 'bg-blue-100 text-blue-700',    icon: '⚙️' },
  sale:       { label: 'Bán hàng',     color: 'bg-rose-100 text-rose-700',    icon: '🛒' },
};

const fmtDate = d => new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const InventoryManagement = () => {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('products');
  const [importModal, setImportModal] = useState(null);
  const [adjustModal, setAdjustModal] = useState(null);
  const [filterLow, setFilterLow] = useState(false);
  const [search, setSearch] = useState('');
  const { data, loading, refetch } = useFetch('/inventory', { page, lowStock: filterLow || undefined, search: search || undefined });
  const { data: materials, refetch: refetchMaterials } = useFetch('/inventory/materials');
  const { data: lowStockData } = useFetch('/inventory/low-stock-count');

  // History tab state
  const [histPage, setHistPage] = useState(1);
  const [histType, setHistType] = useState('');
  const [histSearch, setHistSearch] = useState('');
  const { data: histData, loading: histLoading } = useFetch('/inventory/transactions', {
    page: histPage, limit: 15, type: histType || undefined, search: histSearch || undefined,
  });

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

  const lowCount = lowStockData?.count || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1>Quản lý Kho hàng</h1>
        {lowCount > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-2 rounded-xl text-sm font-semibold">
            <FiAlertTriangle size={15} />
            {lowCount} sản phẩm sắp hết hàng
            <button onClick={() => { setFilterLow(true); setTab('products'); }}
              className="ml-1 text-orange-800 underline text-xs">Xem ngay</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {[['products', 'Tồn kho sản phẩm'], ['materials', 'Nguyên liệu thô'], ['history', 'Lịch sử']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
            {l}
          </button>
        ))}
        {tab === 'products' && (
          <>
            <button onClick={() => { setFilterLow(!filterLow); setPage(1); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${filterLow ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <FiAlertTriangle size={14} /> Sắp hết hàng {lowCount > 0 && `(${lowCount})`}
            </button>
            <div className="relative ml-auto">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Tìm sản phẩm..." className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
          </>
        )}
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
                {!data?.items?.length
                  ? <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có</td></tr>
                  : data.items.map(p => (
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
            <Pagination pagination={data?.pagination} onPageChange={setPage} />
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
              {!(materials || []).length
                ? <tr><td colSpan={4} className="text-center py-12 text-gray-400">Chưa có</td></tr>
                : (materials || []).map(m => (
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

      {tab === 'history' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              {[['', 'Tất cả'], ['import', '📦 Nhập hàng'], ['adjustment', '⚙️ Điều chỉnh'], ['sale', '🛒 Bán hàng']].map(([v, l]) => (
                <button key={v} onClick={() => { setHistType(v); setHistPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${histType === v ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="relative ml-auto">
              <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={histSearch} onChange={e => { setHistSearch(e.target.value); setHistPage(1); }}
                placeholder="Tìm sản phẩm..." className="pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-52 focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
          </div>

          {histLoading ? <Spinner /> : (
            <div className="card overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['Thời gian', 'Loại', 'Sản phẩm', 'Trước', 'Thay đổi', 'Sau', 'Ghi chú', 'Người thực hiện'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y">
                  {!histData?.items?.length
                    ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Chưa có lịch sử</td></tr>
                    : histData.items.map(tx => {
                      const cfg = TX_TYPE[tx.type] || { label: tx.type, color: 'bg-gray-100 text-gray-600', icon: '•' };
                      const isPos = tx.quantity > 0;
                      return (
                        <tr key={tx.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(tx.createdAt)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 max-w-[160px] truncate">{tx.Product?.name}</p>
                            <p className="text-xs text-gray-400">{tx.Product?.code}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-center">{tx.quantityBefore ?? '—'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                              {isPos ? '+' : ''}{tx.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-800 font-medium text-center">{tx.quantityAfter ?? '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{tx.note || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{tx.performer?.fullName || '—'}</td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
              <div className="px-4 pb-2">
                <Pagination pagination={histData?.pagination} onPageChange={setHistPage} />
              </div>
            </div>
          )}
        </div>
      )}

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
