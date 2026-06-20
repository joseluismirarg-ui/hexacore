import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './Button';
import { read, utils } from 'xlsx';
import { api } from '@/lib/api';

interface BulkImportButtonProps {
  endpoint: string;
  onSuccess: () => void;
  label?: string;
}

interface ReportSummary {
  total_records_processed: number;
  successfully_imported: number;
  failed_records: number;
}

interface ReportError {
  row: number;
  identifier: string;
  reason: string;
}

export function BulkImportButton({ endpoint, onSuccess, label = 'Importar Excel' }: BulkImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ summary: ReportSummary; errors: ReportError[] } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setReport(null);

    try {
      // 1. Leer archivo Excel
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // 2. Convertir a JSON
      const json = utils.sheet_to_json(worksheet, { defval: "" });

      // 3. Enviar a la API
      const response = await api.post(endpoint, { data: json });
      
      setReport({
        summary: response.data.summary,
        errors: response.data.errors,
      });

      if (response.data.summary.successfully_imported > 0) {
        onSuccess();
      }

    } catch (err: any) {
      console.error('Error importando archivo:', err);
      alert('Error crítico al procesar el archivo. Revisa el formato.');
    } finally {
      setLoading(false);
      // Reset input para permitir subir el mismo archivo si hubo correcciones
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
        {loading ? 'Procesando...' : label}
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Modal de Reporte */}
      {report && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-hc-surface rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-700 flex justify-between items-start bg-hc-surface-dark">
              <div>
                <h3 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-hc-emerald" />
                  Reporte de Importación
                </h3>
                <p className="text-sm text-gray-400 mt-1">Resultado del procesamiento masivo</p>
              </div>
              <button onClick={() => setReport(null)} className="text-gray-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-gray-400 text-xs font-medium">Procesados</div>
                  <div className="text-2xl font-bold text-white mt-1">{report.summary.total_records_processed}</div>
                </div>
                <div className="bg-hc-emerald/10 rounded-lg p-4 border border-hc-emerald/20">
                  <div className="text-hc-emerald text-xs font-medium">Exitosos</div>
                  <div className="text-2xl font-bold text-hc-emerald mt-1">{report.summary.successfully_imported}</div>
                </div>
                <div className="bg-hc-coral/10 rounded-lg p-4 border border-hc-coral/20">
                  <div className="text-hc-coral text-xs font-medium">Fallidos</div>
                  <div className="text-2xl font-bold text-hc-coral mt-1">{report.summary.failed_records}</div>
                </div>
              </div>

              {report.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-hc-coral" />
                    Detalle de Errores
                  </h4>
                  <div className="space-y-2">
                    {report.errors.map((err, i) => (
                      <div key={i} className="bg-gray-800 rounded p-3 text-sm flex gap-3 items-start border border-gray-700/50">
                        <span className="font-mono text-gray-500 min-w-[60px]">Fila {err.row}</span>
                        <div>
                          <div className="text-gray-300 font-medium">{err.identifier}</div>
                          <div className="text-hc-coral text-xs mt-0.5">{err.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-hc-surface-dark flex justify-end">
              <Button onClick={() => setReport(null)}>Cerrar Reporte</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
