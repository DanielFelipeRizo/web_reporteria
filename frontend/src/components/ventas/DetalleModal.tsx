import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { ventasService } from '@/services/ventas.service';
import { toast } from 'sonner';

interface DetalleModalProps {
  uuid: string;
  onClose: () => void;
}

export default function DetalleModal({ uuid, onClose }: DetalleModalProps) {
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState<any>(null);

  useEffect(() => {
    ventasService.findOne(uuid)
      .then(res => {
        if (!res?.data) toast.error('No se encontraron detalles para esta transacción.');
        setDetalle(res?.data);
      })
      .catch(() => toast.error('Error al cargar detalles'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const Item = ({ label, value }: { label: string, value: any }) => (
    <div style={{ display: 'flex', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ width: '40%', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      <span style={{ width: '60%', color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: 800, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', background: 'var(--bg-card)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>DETALLE TRANSACCIÓN</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', background: 'var(--bg-elevated)' }}>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              Cargando detalle...
            </div>
          ) : detalle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Sección: Datos Comercio */}
              <div>
                <div style={{ background: 'var(--border)', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  DATOS COMERCIO
                </div>
                <div style={{ padding: '0 1rem' }}>
                  <Item label="Nombre comercio" value={detalle.nombre_comercio} />
                  <Item label="Ciudad" value={detalle.ciudad} />
                  <Item label="TID" value={detalle.tid} />
                  <Item label="Versión Pos" value={detalle.modelo_pos} />
                  <Item label="MID" value={detalle.mid} />
                </div>
              </div>

              {/* Sección: Transacción */}
              <div>
                <div style={{ background: 'var(--border)', padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  TRANSACCIÓN
                </div>
                <div style={{ padding: '0 1rem' }}>
                  <Item label="Tipo de transacción" value={detalle.tipo_transaccion} />
                  <Item label="Tipo Envío" value={detalle.tipo_envio} />
                  <Item label="Lote" value={detalle.Transac_Lot || detalle.Res1} />
                  <Item label="Número tarjeta" value={detalle.Transac_NumCard || detalle.Pan} />
                  <Item label="Referencia" value={detalle.Transac_Ref || detalle.Referencia} />
                  <Item label="Autorización" value={detalle.Transac_Aut || detalle.NumeroAprobacion} />
                  <Item label="AID" value={detalle.Transac_AID} />
                  <Item label="RRN" value={detalle.Transac_RRN} />
                  <Item label="Tipo de tarjeta" value={detalle.Transac_Label} />
                  <Item label="Moneda" value="BS." />
                  <Item label="Total" value={detalle.Transac_Total || detalle.MontoPago} />
                  <Item label="Fecha transacción" value={
                    detalle.Transac_Date || detalle.DateTime 
                      ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(detalle.Transac_Date || detalle.DateTime))
                      : '—'
                  } />
                </div>
              </div>

            </div>
          ) : (
             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se pudo cargar el detalle.
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
