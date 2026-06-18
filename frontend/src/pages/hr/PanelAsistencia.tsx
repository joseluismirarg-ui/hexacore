import React, { useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { hrApi, formatDate } from '@/lib/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function PanelAsistencia() {
  const { data: attendanceData, loading, execute: fetchAttendance } = useAsync(() => hrApi.attendanceDashboard(), false);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const attendances = (attendanceData as any)?.data || [];

  const columns: Column[] = [
    { header: 'Empleado', accessor: (row) => row.user?.name || 'Desconocido' },
    { 
      header: 'Hora Entrada', 
      accessor: (row) => row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : '---' 
    },
    { 
      header: 'Hora Salida', 
      accessor: (row) => row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : '---' 
    },
    { 
      header: 'Estatus Puntualidad', 
      accessor: (row) => {
        if (!row.checkIn) return <span className="text-gray-500">Pendiente</span>;
        
        const shiftStartStr = row.user?.employeeProfile?.shiftStartTime || '09:00';
        const [hours, minutes] = shiftStartStr.split(':').map(Number);
        
        const checkInDate = new Date(row.checkIn);
        const shiftStartDate = new Date(row.checkIn);
        shiftStartDate.setHours(hours, minutes, 0, 0);

        // Tolerancia de 10 minutos (opcional, ajusta según negocio)
        shiftStartDate.setMinutes(shiftStartDate.getMinutes() + 10);

        if (checkInDate <= shiftStartDate) {
          return (
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle2 className="w-4 h-4" /> A Tiempo
            </div>
          );
        } else {
          return (
            <div className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-4 h-4" /> Retardo
            </div>
          );
        }
      }
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Asistencia del Día</h2>
          <p className="text-sm text-muted-foreground">{formatDate(new Date().toISOString())}</p>
        </div>
        <button 
          onClick={fetchAttendance}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/80"
        >
          <Clock className="w-4 h-4" />
          Actualizar Tablero
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden p-1">
        <DataTable columns={columns} data={attendances} loading={loading} />
      </div>
    </div>
  );
}
