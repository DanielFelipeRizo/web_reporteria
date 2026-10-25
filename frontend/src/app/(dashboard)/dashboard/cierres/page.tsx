'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Eraser, ChevronLeft, ChevronRight, Calculator, FileText } from 'lucide-react';
import { cierresService, CierresFilter, CierreRow } from '@/services/cierres.service';
import { ventasService } from '@/services/ventas.service';
import VoucherModal from '@/components/ventas/VoucherModal';

export default function CierresPage() {
  const [cierres, setCierres] = useState<CierreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Listas de opciones para filtros (reutiliza endpoints de ventas)
  const [modelos, setModelos] = useState<{model_descripcion: string}[]>([]);
  const [tiposTransaccion, setTiposTransaccion] = useState<{id_transac: number, descripcion: string}[]>([]);

  // Modal de Voucher
  const [openVoucher, setOpenVoucher] = useState<string | null>(null);

  // Búsqueda Rápida local
  const [quickSearch, setQuickSearch] = useState('');

  // Filtros de UI
  const [filters, setFilters] = useState<CierresFilter>({
    modeloPos: '', tipoTransaccion: '', nombreComercio: '', tid: '', mid: '', lote: '', fechaDesde: '', fechaHasta: ''
  });

  // Cargar listas iniciales
  useEffect(() => {
    ventasService.getModelos().then(setModelos).catch(console.error);
  }, []);

  // Cargar tipos de transacción cuando cambia el modelo
  useEffect(() => {
    if (filters.modeloPos) {
      cierresService.getTiposCierre(filters.modeloPos).then(setTiposTransaccion).catch(console.error);
    } else {
      setTiposTransaccion([]);
      setFilters(prev => ({ ...prev, tipoTransaccion: '' }));
    }
  }, [filters.modeloPos]);

  const searchCierres = useCallback(async (pageToLoad: number = 1) => {
    setLoading(true);
    try {
      const resp = await cierresService.findAll({ ...filters, page: pageToLoad, limit: pageSize });
      setCierres(resp.data);
      setMeta(resp.meta);
    } catch {
      toast.error('Error al consultar cierres');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  useEffect(() => { searchCierres(1); }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCierres(1);
  };

  const handleClear = () => {
    setFilters({
      modeloPos: '', tipoTransaccion: '', nombreComercio: '', tid: '', mid: '', lote: '', fechaDesde: '', fechaHasta: ''
    });
    setQuickSearch('');
    setTimeout(() => searchCierres(1), 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d);
  };

  // Filtrado local
  const filteredCierres = cierres.filter(v => 
    Object.values(v).some(val => String(val || '').toLowerCase().includes(quickSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Calculator size={18} style={{ color: 'var(--accent-light)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>CIERRE TRANSACCIÓN</h2>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Modelo terminal</label>
              <select className="input" value={filters.modeloPos} onChange={e => setFilters({ ...filters, modeloPos: e.target.value })}>
                <option value="">Todos</option>
                {modelos.map((m, i) => <option key={i} value={m.model_descripcion}>{m.model_descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem', color: !filters.modeloPos ? 'var(--text-muted)' : undefined }}>Tipo de transacción</label>
              <select className="input" disabled={!filters.modeloPos} value={filters.tipoTransaccion} onChange={e => setFilters({ ...filters, tipoTransaccion: e.target.value })}>
                <option value="">Todos</option>
                {tiposTransaccion.map((t, i) => <option key={i} value={t.id_transac?.toString() || ""}>{t.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Nombre Comercio</label>
              <input type="text" className="input" placeholder="Nombre Comercio" value={filters.nombreComercio} onChange={e => setFilters({ ...filters, nombreComercio: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>MID</label>
              <input type="text" className="input" placeholder="MID" value={filters.mid} onChange={e => setFilters({ ...filters, mid: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>TID</label>
              <input type="text" className="input" placeholder="TID" value={filters.tid} onChange={e => setFilters({ ...filters, tid: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Lote</label>
              <input type="text" className="input" placeholder="Lote" value={filters.lote} onChange={e => setFilters({ ...filters, lote: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ marginBottom: '0.4rem' }}>Fecha Desde</label>
                <input type="date" className="input" value={filters.fechaDesde} onChange={e => setFilters({ ...filters, fechaDesde: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label" style={{ marginBottom: '0.4rem' }}>Fecha Hasta</label>
                <input type="date" className="input" value={filters.fechaHasta} onChange={e => setFilters({ ...filters, fechaHasta: e.target.value })} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <Loader2 size={18} className="spin" /> : <Search size={18} />} Búsqueda
            </button>
            <button type="button" className="btn-secondary" onClick={handleClear} disabled={loading}>
              <Eraser size={18} /> Limpiar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* ── Tabla de Resultados ──────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <FileText size={16} style={{ color: 'var(--accent-light)' }} />
              CIERRES
            </h3>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Búsqueda rápida..." 
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: '1rem', width: '250px', borderRadius: '20px', fontSize: '0.8rem', height: '32px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {meta.total} registros
          </span>
        </div>

        {loading && <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 size={32} className="spin" style={{ color: 'var(--accent-light)', margin: '0 auto' }} /></div>}
        
        {!loading && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--accent-light)', color: '#fff' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Nombre de comercio</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>MID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>TID</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Lote</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Fecha de cierre</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>Modelo de terminal</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600, whiteSpace: 'nowrap' }}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {filteredCierres.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos para mostrar</td></tr>
                ) : filteredCierres.map((v, i) => (
                  <tr key={i}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-base)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-base)')}
                  >
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{v.Merchant_Name}</td>
                    <td style={{ padding: '0.75rem' }}>{v.Merchant_MID}</td>
                    <td style={{ padding: '0.75rem' }}>{v.Merchant_TID}</td>
                    <td style={{ padding: '0.75rem' }}>{v.Cierre_Lot}</td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(v.Cierre_Date)}</td>
                    <td style={{ padding: '0.75rem' }}>{v.MODELOPOS}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => setOpenVoucher(v.Cierre_UUID)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }} title="Ver Voucher">
                        <FileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Paginación ─────────────────────────────────────────────────── */}
        {!loading && meta.totalPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>Mostrando página {meta.page} de {meta.totalPages}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Registros por página:</span>
                <select 
                  className="input" 
                  style={{ padding: '0.2rem 0.5rem', height: 'auto', fontSize: '0.8rem', width: 'auto' }}
                  value={pageSize}
                  onChange={e => {
                    const newSize = Number(e.target.value);
                    setPageSize(newSize);
                    setLoading(true);
                    cierresService.findAll({ ...filters, page: 1, limit: newSize }).then(resp => {
                      setCierres(resp.data);
                      setMeta(resp.meta);
                    }).catch(() => toast.error('Error al consultar cierres')).finally(() => setLoading(false));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page <= 1} onClick={() => searchCierres(meta.page - 1)}><ChevronLeft size={14} /></button>
              <span style={{ color: 'var(--accent-light)', minWidth: '1.5rem', textAlign: 'center' }}>{meta.page}</span>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page >= meta.totalPages} onClick={() => searchCierres(meta.page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {openVoucher && <VoucherModal uuid={openVoucher} source="cierres" onClose={() => setOpenVoucher(null)} />}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
