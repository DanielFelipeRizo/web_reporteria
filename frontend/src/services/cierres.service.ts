import api from '@/lib/api';

export interface CierreRow {
  Cierre_id: bigint | number;
  Cierre_TerminalID: string;
  Cierre_Lot: string | null;
  Cierre_Date: string;
  Cierre_TypeTrx: number;
  Cierre_TypeCierre: number;
  Cierre_Totales: string;
  Cierre_Batch: string;
  Merchant_Email: string;
  Merchant_Name: string | null;
  Merchant_Address: string | null;
  Merchant_Phone: string | null;
  Merchant_City: string;
  Merchant_MID: string;
  Merchant_TID: string;
  Cierre_UUID: string;
  MODELOPOS: string | null;
}

export interface CierresFilter {
  modeloPos?: string;
  tipoTransaccion?: string;
  nombreComercio?: string;
  mid?: string;
  tid?: string;
  lote?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

export interface CierresResponse {
  data: CierreRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const cierresService = {
  getTiposCierre: async (modelo: string) => {
    const { data } = await api.get<{id_transac: number, descripcion: string}[]>(`/cierres/options/tipos-cierre/${modelo}`);
    return data;
  },

  findAll: async (filters: CierresFilter): Promise<CierresResponse> => {
    // Limpiar nulos y vacíos
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v != null && v !== '')
    );
    const { data } = await api.get('/cierres', { params });
    return data;
  },

  getVoucher: async (uuid: string) => {
    const { data } = await api.get(`/cierres/${uuid}/voucher`);
    return data;
  },
};
