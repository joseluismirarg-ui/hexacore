import React from 'react';
import { transaccionesApi, inventarioApi, comprasApi } from '../lib/api';

export default function ModuloReportes() {

  const handleDownload = async (title: string, fetchFn: () => Promise<any>, mapFn: (data: any) => any[]) => {
    try {
      const response = await fetchFn();
      const rawData = response.data;
      const csvData = mapFn(rawData);

      if (csvData.length === 0) {
        alert('No hay datos para exportar.');
        return;
      }

      // Convert to CSV
      const headers = Object.keys(csvData[0]);
      const csvRows = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => `"${(row[header] ?? '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ];
      
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${title}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      alert(`Error al generar el reporte de ${title}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Reportes</h1>
        <p className="text-muted-foreground">Exportación de inteligencia de negocios a CSV.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Ventas */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold">Reporte de Ventas</h3>
            <p className="text-sm text-muted-foreground mt-2">Exporta todas las transacciones de ventas con montos totales, fechas y responsables.</p>
          </div>
          <button
            onClick={() => handleDownload('Ventas', () => transaccionesApi.listar(), (data) => data.map((t: any) => ({
              ID: t.uuid,
              Fecha: t.createdAt,
              Tipo: t.tipo,
              Status: t.status,
              Total: t.total,
              Cliente: t.customer?.companyName || 'N/A',
              Vendedor: t.user?.name || 'N/A'
            })))}
            className="mt-6 w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
          >
            Descargar CSV
          </button>
        </div>

        {/* Kardex */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold">Movimientos de Kardex</h3>
            <p className="text-sm text-muted-foreground mt-2">Bitácora completa de entradas, salidas y traspasos de inventario.</p>
          </div>
          <button
            onClick={() => handleDownload('Kardex', () => inventarioApi.kardex(), (data) => data.map((k: any) => ({
              Fecha: k.timestamp,
              Tipo: k.tipo,
              Producto: k.product?.name,
              Cantidad: k.cantidad,
              Usuario: k.user?.name,
              Notas: k.notes
            })))}
            className="mt-6 w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
          >
            Descargar CSV
          </button>
        </div>

        {/* Compras */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold">Órdenes de Compra</h3>
            <p className="text-sm text-muted-foreground mt-2">Histórico de abastecimiento a proveedores y estatus de recepción.</p>
          </div>
          <button
            onClick={() => handleDownload('Compras', () => comprasApi.listar(), (data) => data.map((oc: any) => ({
              ID: oc.id,
              FechaCreacion: oc.createdAt,
              FechaRecepcion: oc.receivedAt,
              Proveedor: oc.supplier?.name,
              Status: oc.status,
              MontoTotal: oc.totalAmount
            })))}
            className="mt-6 w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
          >
            Descargar CSV
          </button>
        </div>
      </div>
    </div>
  );
}
