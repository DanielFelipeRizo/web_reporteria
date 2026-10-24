'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, Search, Eraser, ChevronLeft, ChevronRight, ShoppingCart, Eye, FileText } from 'lucide-react';
import { ventasService, VentasFilter, VentaRow } from '@/services/ventas.service';
import VoucherModal from '@/components/ventas/VoucherModal';
import DetalleModal from '@/components/ventas/DetalleModal';

const PAGE_SIZE = 20;

export default function VentasPage() {
  const [ventas, setVentas] = useState<VentaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(20);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  // Listas de opciones para filtros
  const [modelos, setModelos] = useState<{model_descripcion: string}[]>([]);
  const [tiposTarjeta, setTiposTarjeta] = useState<{Transac_Label: string}[]>([]);
  const [tiposTransaccion, setTiposTransaccion] = useState<{transacId: number, descripcion: string}[]>([]);

  // Modales
  const [openVoucher, setOpenVoucher] = useState<string | null>(null);
  const [openDetalle, setOpenDetalle] = useState<string | null>(null);

  // Búsqueda Rápida local
  const [quickSearch, setQuickSearch] = useState('');

  // Filtros de UI
  const [filters, setFilters] = useState<VentasFilter>({
    modeloPos: '', tipoTarjeta: '', tipoTransaccion: '', referencia: '', tid: '', mid: '',
    numAprobacion: '', numLote: '', numTarjeta: '', nombreComercio: '',
    fechaDesde: '', fechaHasta: ''
  });

  // Cargar listas iniciales
  useEffect(() => {
    ventasService.getModelos().then(setModelos).catch(console.error);
    ventasService.getTiposTarjeta().then(setTiposTarjeta).catch(console.error);
  }, []);

  // Cargar tipos de transacción cuando cambia el modelo
  useEffect(() => {
    if (filters.modeloPos) {
      ventasService.getTiposTransaccion(filters.modeloPos).then(setTiposTransaccion).catch(console.error);
    } else {
      setTiposTransaccion([]);
      setFilters(prev => ({ ...prev, tipoTransaccion: '' }));
    }
  }, [filters.modeloPos]);

  const searchVentas = useCallback(async (pageToLoad: number = 1) => {
    setLoading(true);
    try {
      const resp = await ventasService.findAll({ ...filters, page: pageToLoad, limit: pageSize });
      setVentas(resp.data);
      setMeta(resp.meta);
    } catch {
      toast.error('Error al consultar ventas');
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize]);

  useEffect(() => { searchVentas(1); }, []); // eslint-disable-line

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchVentas(1);
  };

  const handleClear = () => {
    setFilters({
      modeloPos: '', tipoTarjeta: '', tipoTransaccion: '', referencia: '', tid: '', mid: '',
      numAprobacion: '', numLote: '', numTarjeta: '', nombreComercio: '',
      fechaDesde: '', fechaHasta: ''
    });
    setTimeout(() => searchVentas(1), 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d);
  };

  const filteredVentas = ventas.filter(v => 
    Object.values(v).some(val => String(val || '').toLowerCase().includes(quickSearch.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '1.5rem', borderTop: '4px solid var(--accent-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <ShoppingCart size={18} style={{ color: 'var(--accent-light)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>FILTRO VENTAS</h2>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Modelo de terminal</label>
              <select className="input" value={filters.modeloPos} onChange={e => setFilters({ ...filters, modeloPos: e.target.value })}>
                <option value="">Todos</option>
                {modelos.map((m, i) => <option key={i} value={m.model_descripcion}>{m.model_descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem', color: !filters.modeloPos ? 'var(--text-muted)' : undefined }}>Tipo de transacción</label>
              <select className="input" disabled={!filters.modeloPos} value={filters.tipoTransaccion} onChange={e => setFilters({ ...filters, tipoTransaccion: e.target.value })}>
                <option value="">Todos</option>
                {tiposTransaccion.map((t, i) => <option key={i} value={t.transacId?.toString() || ""}>{t.descripcion}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Tipo tarjeta</label>
              <select className="input" value={filters.tipoTarjeta} onChange={e => setFilters({ ...filters, tipoTarjeta: e.target.value })}>
                <option value="">Todas</option>
                {tiposTarjeta.map((t, i) => <option key={i} value={t.Transac_Label}>{t.Transac_Label}</option>)}
              </select>
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Referencia</label>
              <input type="text" className="input" value={filters.referencia} onChange={e => setFilters({ ...filters, referencia: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>TID</label>
              <input type="text" className="input" value={filters.tid} onChange={e => setFilters({ ...filters, tid: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>MID</label>
              <input type="text" className="input" value={filters.mid} onChange={e => setFilters({ ...filters, mid: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>No. Aprobación</label>
              <input type="text" className="input" value={filters.numAprobacion} onChange={e => setFilters({ ...filters, numAprobacion: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>No. Lote</label>
              <input type="text" className="input" value={filters.numLote} onChange={e => setFilters({ ...filters, numLote: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Número de tarjeta</label>
              <input type="text" className="input" value={filters.numTarjeta} onChange={e => setFilters({ ...filters, numTarjeta: e.target.value })} />
            </div>
            <div>
              <label className="label" style={{ marginBottom: '0.4rem' }}>Nombre del comercio</label>
              <input type="text" className="input" value={filters.nombreComercio} onChange={e => setFilters({ ...filters, nombreComercio: e.target.value })} />
            </div>
            
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem' }}>
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="submit" className="btn-primary" style={{ minWidth: 120, justifyContent: 'center', borderRadius: '20px' }} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
              Búsqueda
            </button>
            <button type="button" className="btn-secondary" style={{ minWidth: 120, justifyContent: 'center', borderRadius: '20px' }} onClick={handleClear} disabled={loading}>
              Limpiar filtros
            </button>
          </div>
        </form>
      </div>

      {/* ── Resultados ───────────────────────────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
              <ShoppingCart size={16} style={{ color: 'var(--accent-light)' }} />
              VENTAS
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

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 0.5rem', display: 'block' }} />
            Buscando transacciones…
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--accent-light)', color: '#fff' }}>
                  {['Nombre del comercio', 'Referencia', 'Número de tarjeta', 'Fecha de transacción', 'Tipo de transacción', 'Modelo de terminal', 'Estado del voucher', 'Tipo Envío', 'Estado del modo caja', 'Ver', 'Detalle'].map(h => (
                    <th key={h} style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVentas.length === 0 ? (
                  <tr><td colSpan={11} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos para mostrar</td></tr>
                ) : filteredVentas.map((v, i) => (
                  <tr key={i}
                    style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-base)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-base)')}
                  >
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{v.nombre_comercio}</td>
                    <td style={{ padding: '0.75rem' }}>{v.referencia}</td>
                    <td style={{ padding: '0.75rem' }}>{v.num_tarjeta}</td>
                    <td style={{ padding: '0.75rem', whiteSpace: 'nowrap' }}>{formatDate(v.fecha_transaccion)}</td>
                    <td style={{ padding: '0.75rem' }}>{v.tipo_transaccion}</td>
                    <td style={{ padding: '0.75rem' }}>{v.modelo_pos}</td>
                    <td style={{ padding: '0.75rem' }}>{v.estado_voucher}</td>
                    <td style={{ padding: '0.75rem' }}>{v.tipo_envio}</td>
                    <td style={{ padding: '0.75rem' }}>{v.modo_caja === 'true' || v.modo_caja === '1' ? 'Activo' : 'Inactivo'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => setOpenVoucher(v.uuid)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }} title="Ver Voucher">
                        <FileText size={18} />
                      </button>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => setOpenDetalle(v.uuid)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-light)', cursor: 'pointer' }} title="Ver Detalle">
                        <Eye size={18} />
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
                    // Search using the new size directly to avoid state race condition
                    setLoading(true);
                    ventasService.findAll({ ...filters, page: 1, limit: newSize }).then(resp => {
                      setVentas(resp.data);
                      setMeta(resp.meta);
                    }).catch(() => toast.error('Error al consultar ventas')).finally(() => setLoading(false));
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
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page <= 1} onClick={() => searchVentas(meta.page - 1)}><ChevronLeft size={14} /></button>
              <span style={{ color: 'var(--accent-light)', minWidth: '1.5rem', textAlign: 'center' }}>{meta.page}</span>
              <button className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }} disabled={meta.page >= meta.totalPages} onClick={() => searchVentas(meta.page + 1)}><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>

      {openVoucher && <VoucherModal uuid={openVoucher} onClose={() => setOpenVoucher(null)} />}
      {openDetalle && <DetalleModal uuid={openDetalle} onClose={() => setOpenDetalle(null)} />}
      
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
