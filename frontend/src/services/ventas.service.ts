import api from '@/lib/api';

export interface VentasFilter {
  modeloPos?: string;
  tipoTarjeta?: string;
  tipoTransaccion?: string;
  referencia?: string;
  tid?: string;
  mid?: string;
  numAprobacion?: string;
  numLote?: string;
  numTarjeta?: string;
  nombreComercio?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface VentaRow {
  tipo_transaccion: string;
  nombre_comercio: string;
  ciudad: string;
  lote: string;
  tid: string;
  mid: string;
  num_tarjeta: string;
  referencia: string;
  num_aprobacion: string;
  aid: string;
  label: string;
  fecha_transaccion: string;
  uuid: string;
  modelo_pos: string;
  tipo_trx_id: string;
  estado_voucher: string;
  modo_caja: string;
  tipo_sale: string;
  tipo_envio: string;
  tipo: string;
}

export interface VentasResponse {
  data: VentaRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface VoucherResponse {
  html_voucher: string;
  pdf_base64: string;
  type_trx: string;
  insertion_date: string;
}

export const ventasService = {
  getModelos: async () => {
    const { data } = await api.get<{model_descripcion: string}[]>('/ventas/options/modelos');
    return data;
  },
  getTiposTransaccion: async (modelo: string) => {
    const { data } = await api.get<{transacId: number, descripcion: string}[]>(`/ventas/options/tipos-transaccion/${modelo}`);
    return data;
  },
  getTiposTarjeta: async () => {
    const { data } = await api.get<{Transac_Label: string}[]>('/ventas/options/tipos-tarjeta');
    return data;
  },
  findAll: async (filters: VentasFilter): Promise<VentasResponse> => {
    // Limpiar nulos y vacíos
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== '')
    );
    const { data } = await api.get<VentasResponse>('/ventas', { params });
    return data;
  },

  findOne: async (uuid: string) => {
    const { data } = await api.get(`/ventas/${uuid}/detalle`);
    return data;
  },

  getVoucher: async (uuid: string): Promise<VoucherResponse> => {
    const { data } = await api.get<VoucherResponse>(`/ventas/${uuid}/voucher`);
    return data;
  },
};
