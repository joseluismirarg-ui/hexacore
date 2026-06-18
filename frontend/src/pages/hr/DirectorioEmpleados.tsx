import React, { useState, useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { hrApi } from '@/lib/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Plus, Edit2, ShieldAlert } from 'lucide-react';

export default function DirectorioEmpleados() {
  const { data: employeesData, loading, execute: fetchEmployees } = useAsync(() => hrApi.empleados(), false);
  
  useEffect(() => {
    fetchEmployees();
  }, []);

  const employees = (employeesData as any)?.data || [];

  const columns: Column<any>[] = [
    { header: 'Matrícula', accessor: 'employeeCode', render: (row: any) => row.employeeProfile?.employeeCode || 'S/N' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Rol', accessor: 'role' },
    { header: 'Teléfono', accessor: 'phone', render: (row: any) => row.employeeProfile?.phone || 'N/D' },
    { header: 'Tipo Sueldo', accessor: 'salaryPeriod', render: (row: any) => row.employeeProfile?.salaryPeriod || 'N/D' },
    { 
      header: 'Acciones', 
      accessor: 'actions',
      render: (row: any) => (
        <button className="text-gray-400 hover:text-white" onClick={() => alert('Próximamente: Editar empleado ' + row.name)}>
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <h2 className="text-lg font-semibold text-foreground">Directorio de Empleados</h2>
        <button 
          onClick={() => alert('Próximamente: Modal de Creación')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Registrar Empleado
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden p-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
        ) : (
          <DataTable columns={columns} data={employees} keyExtractor={(row: any) => row.id} />
        )}
      </div>
    </div>
  );
}
