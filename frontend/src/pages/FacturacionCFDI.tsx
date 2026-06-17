import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileDown,
  Loader2,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatTimestamp, facturasApi, transaccionesApi, ApiError } from '@/lib/api';

interface Invoice {
  id: string;
  uuid_sat: string;
  rfc_receptor: string;
  regimen_fiscal: string;
  uso_cfdi: string;
  status: 'TIMBRADA' | 'CANCELADA' | 'ERROR_SAT';
  pdfUrl?: string;
  xmlUrl?: string;
  createdAt: string;
  customer: { id: string; companyName: string; rfc: string };
  transaction: { id: string; tipo: string; total: string; createdAt: string };
}

interface TransactionToInvoice {
  id: string;
  tipo: string;
  total: string;
  createdAt: string;
  customer: { id: string; companyName: string; rfc?: string };
}

const USOS_CFDI = [
  { value: 'G01', label: 'Adquisición de mercancias' },
  { value: 'G03', label: 'Gastos en general' },
  { value: 'I01', label: 'Construcciones' },
  { value: 'D01', label: 'Honorarios médicos, dentales y gastos' },
  { value: 'P01', label: 'Por definir' },
  { value: 'S01', label: 'Sin efectos fiscales' },
];

export function FacturacionCFDI() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<TransactionToInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Timbrado
  const [timbrarModal, setTimbrarModal] = useState<TransactionToInvoice | null>(null);
  const [rfcReceptor, setRfcReceptor] = useState('');
  const [regimenFiscal, setRegimenFiscal] = useState('601');
  const [usoCfdi, setUsoCfdi] = useState('G01');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [iRes, tRes] = await Promise.all([
        facturasApi.listar() as any,
        transaccionesApi.listar('status=COMPLETADO&limit=50') as any, // Recientes para timbrar
      ]);
      
      console.log('🧾 DATOS DE FACTURACIÓN Y VENTAS RECIBIDOS:', {
        facturas: iRes.data,
        transacciones: tRes.data
      });

      setInvoices(iRes.data ?? []);
      
      // Filtrar transacciones que ya están facturadas (en UI simple por ahora)
      const facturadas = new Set((iRes.data ?? []).filter((x: Invoice) => x.status === 'TIMBRADA').map((x: Invoice) => x.transaction.id));
      setTransactions((tRes.data ?? []).filter((t: TransactionToInvoice) => !facturadas.has(t.id)));

    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al cargar facturas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTimbrar = async () => {
    if (!timbrarModal || !rfcReceptor || !regimenFiscal || !usoCfdi) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await facturasApi.timbrar({
        transactionId: timbrarModal.id,
        customerId: timbrarModal.customer.id,
        rfc_receptor: rfcReceptor.trim().toUpperCase(),
        regimen_fiscal: regimenFiscal.trim(),
        uso_cfdi: usoCfdi,
      });

      setSuccessMsg('Factura CFDI 4.0 timbrada exitosamente (Mock)');
      setTimbrarModal(null);
      loadData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Error al timbrar factura');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta factura en el SAT?')) return;
    try {
      await facturasApi.cancelar(id);
      setSuccessMsg('Factura cancelada correctamente');
      loadData();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Error al cancelar');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-50">Facturación CFDI 4.0</h1>
          <p className="mt-1 text-sm text-gray-500">Gestión de facturas electrónicas y timbrado (Mock)</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-hc-emerald/30 bg-hc-emerald/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-hc-emerald" />
          <p className="text-sm font-medium text-hc-emerald">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* ═══ LEFT — Facturas Emitidas ═══ */}
        <div className="xl:col-span-8">
          <div className="card p-0 h-full">
            <div className="px-5 py-3 border-b border-gray-700/40">
              <h2 className="text-sm font-semibold text-gray-200">Facturas Emitidas</h2>
            </div>
            
            {isLoading ? (
              <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-hc-cobalt-light" /></div>
            ) : error ? (
              <div className="p-4 text-hc-coral text-sm">{error}</div>
            ) : (invoices || []).length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No hay facturas emitidas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-hc-surface-dark border-b border-gray-700/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Timbrado</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">UUID SAT</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Cliente / RFC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Total</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-400">Estado</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {(invoices || []).map((inv) => (
                      <tr key={inv?.id} className="table-row-hover">
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatTimestamp(inv?.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xxs text-hc-cobalt-light break-all max-w-[150px]">
                          {inv?.uuid_sat}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-200 text-xs truncate max-w-[150px]">{inv?.customer?.companyName}</p>
                          <p className="font-mono text-xxs text-gray-500">{inv?.rfc_receptor}</p>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-gray-200">
                          {formatCurrency(inv?.transaction?.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={inv?.status === 'TIMBRADA' ? 'emerald' : 'coral'} size="sm">
                            {inv?.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {inv?.status === 'TIMBRADA' && (
                            <div className="flex items-center justify-center gap-2">
                              {inv?.pdfUrl && (
                                <a href={inv?.pdfUrl} target="_blank" rel="noreferrer" title="Descargar PDF" className="text-gray-400 hover:text-gray-200">
                                  <FileText className="h-4 w-4" />
                                </a>
                              )}
                              <button onClick={() => handleCancelar(inv?.id)} title="Cancelar CFDI" className="text-gray-400 hover:text-hc-coral">
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT — Transacciones pendientes de facturar ═══ */}
        <div className="xl:col-span-4">
          <div className="card p-0 h-full">
            <div className="px-5 py-3 border-b border-gray-700/40">
              <h2 className="text-sm font-semibold text-gray-200">Pendientes de Facturar</h2>
            </div>
            
            <div className="divide-y divide-gray-700/30 max-h-[600px] overflow-y-auto">
              {!isLoading && (transactions || []).length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">Al día.</div>
              ) : (
                (transactions || []).map((t) => (
                  <div key={t?.id} className="p-4 hover:bg-hc-surface-dark/50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{t?.customer?.companyName}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(t?.createdAt)}</p>
                      </div>
                      <Badge variant="cobalt" size="sm">{t?.tipo}</Badge>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-mono font-bold text-gray-100">{formatCurrency(t?.total)}</span>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Check}
                        onClick={() => {
                          setTimbrarModal(t);
                          setRfcReceptor(t?.customer?.rfc || '');
                          setRegimenFiscal('601');
                          setUsoCfdi('G01');
                        }}
                      >
                        Timbrar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Timbrar */}
      {timbrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700/50 bg-hc-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-100">Timbrar Factura</h2>
              <button onClick={() => setTimbrarModal(null)} className="text-gray-400 hover:text-gray-200">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-lg bg-hc-surface-dark border border-gray-700/40 p-4 mb-5">
              <p className="text-xs text-gray-500">Transacción a facturar</p>
              <p className="font-medium text-gray-200 mt-1">{timbrarModal?.customer?.companyName}</p>
              <p className="font-mono font-bold text-hc-emerald text-lg mt-1">{formatCurrency(timbrarModal?.total)}</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">RFC Receptor *</label>
                <input
                  type="text"
                  value={rfcReceptor}
                  onChange={(e) => setRfcReceptor(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Régimen Fiscal *</label>
                <input
                  type="text"
                  value={regimenFiscal}
                  onChange={(e) => setRegimenFiscal(e.target.value)}
                  placeholder="601"
                  className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">Uso CFDI *</label>
                <select
                  value={usoCfdi}
                  onChange={(e) => setUsoCfdi(e.target.value)}
                  className="w-full rounded-lg border border-gray-700/50 bg-hc-surface-dark px-3 py-2 text-sm text-gray-200 focus:border-hc-cobalt focus:outline-none"
                >
                  {USOS_CFDI.map((u) => (
                    <option key={u.value} value={u.value}>{u.value} - {u.label}</option>
                  ))}
                </select>
              </div>

              {submitError && (
                <div className="flex items-center gap-2 rounded-lg border border-hc-coral/30 bg-hc-coral/5 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-hc-coral flex-shrink-0" />
                  <p className="text-xs text-hc-coral">{submitError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" size="md" fullWidth onClick={() => setTimbrarModal(null)}>Cancelar</Button>
              <Button variant="primary" size="md" fullWidth loading={submitting} disabled={!rfcReceptor || !regimenFiscal || !usoCfdi} onClick={handleTimbrar}>
                Timbrar CFDI
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
