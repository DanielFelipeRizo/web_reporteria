import { useEffect, useState } from 'react';
import { Download, Loader2, X } from 'lucide-react';
import { ventasService, VoucherResponse } from '@/services/ventas.service';
import { toast } from 'sonner';

interface VoucherModalProps {
  uuid: string;
  onClose: () => void;
}

export default function VoucherModal({ uuid, onClose }: VoucherModalProps) {
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<VoucherResponse | null>(null);

  useEffect(() => {
    ventasService.getVoucher(uuid)
      .then(data => {
        if (!data) toast.error('No se encontró el voucher para esta transacción.');
        setVoucher(data);
      })
      .catch(() => toast.error('Error al cargar el voucher'))
      .finally(() => setLoading(false));
  }, [uuid]);

  const handleDownload = () => {
    if (!voucher?.pdf_base64) {
      toast.error('El PDF no está disponible para este voucher.');
      return;
    }
    // Descargar desde base64
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${voucher.pdf_base64}`;
    link.download = `Voucher_${uuid}.pdf`;
    link.click();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '500px', height: '85vh', maxHeight: '800px',
        display: 'flex', flexDirection: 'column', background: 'var(--bg-card)'
      }}>
        
        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>TICKET</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
          
          <button 
            className="btn-primary" 
            onClick={handleDownload} 
            disabled={loading || !voucher?.pdf_base64}
            style={{ borderRadius: '20px', padding: '0.5rem 2rem', fontWeight: 600, flexShrink: 0 }}
          >
            <Download size={16} /> Descargar PDF
          </button>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
              Cargando voucher...
            </div>
          ) : voucher?.html_voucher ? (
            <div style={{ width: '100%', flex: 1, background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { 
                          margin: 0; padding: 20px; 
                          display: flex; justify-content: center; 
                          font-family: sans-serif;
                          background: #fff;
                        }
                        .responsive-wrapper {
                          zoom: 0.9;
                          max-width: 100%;
                          overflow-x: auto;
                        }
                        /* Prevenir que tablas duras rompan el diseño */
                        table { max-width: 100% !important; }
                      </style>
                    </head>
                    <body>
                      <div class="responsive-wrapper">
                        ${voucher.html_voucher}
                      </div>
                    </body>
                  </html>
                `}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Ticket"
              />
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No hay vista previa HTML disponible.
            </div>
          )}

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
