import React, { useState, useEffect } from 'react';
import { useAsync } from '@/lib/hooks';
import { hrApi } from '@/lib/api';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Plus, Edit2, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DirectorioEmpleados() {
  const { data: employeesData, loading, execute: fetchEmployees } = useAsync(() => hrApi.empleados(), false);
  const { user: currentUser } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'VENDEDOR',
    password: '',
    employeeCode: '',
    phone: '',
    salaryPeriod: 'QUINCENAL',
    shiftStartTime: '09:00'
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const employees = (employeesData as any)?.data || [];
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  const handleOpenModal = (employee: any = null) => {
    setError(null);
    if (employee) {
      setEditingId(employee.id);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        role: employee.role || 'VENDEDOR',
        password: '', // Password is not loaded for editing
        employeeCode: employee.employeeProfile?.employeeCode || '',
        phone: employee.employeeProfile?.phone || '',
        salaryPeriod: employee.employeeProfile?.salaryPeriod || 'QUINCENAL',
        shiftStartTime: employee.employeeProfile?.shiftStartTime || '09:00'
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '', email: '', role: 'VENDEDOR', password: '',
        employeeCode: '', phone: '', salaryPeriod: 'QUINCENAL', shiftStartTime: '09:00'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (editingId) {
        await hrApi.actualizarEmpleado(editingId, formData);
      } else {
        if (!formData.password) {
          throw new Error('La contraseña es obligatoria para nuevos empleados.');
        }
        await hrApi.crearEmpleado(formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error al guardar el empleado.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <button 
          className="text-gray-400 hover:text-white transition-colors" 
          onClick={() => handleOpenModal(row)}
          title="Editar Empleado"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4 animate-in fade-in relative">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border">
        <h2 className="text-lg font-semibold text-foreground">Directorio de Empleados</h2>
        <button 
          onClick={() => handleOpenModal()}
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h3 className="text-lg font-semibold text-foreground">
                {editingId ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <form id="employee-form" onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre Completo</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol del Sistema</label>
                  <select 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    disabled={!isAdmin && formData.role === 'ADMIN'}
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ALMACENISTA">Almacenista</option>
                    <option value="RH">Recursos Humanos</option>
                    {isAdmin && <option value="ADMIN">Administrador</option>}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña {editingId && <span className="text-muted-foreground font-normal">(Dejar en blanco para no cambiar)</span>}</label>
                  <input 
                    type="password" 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder={editingId ? '••••••••' : 'Asignar contraseña'}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Matrícula (Código)</label>
                  <input 
                    type="text" 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.employeeCode}
                    onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <input 
                    type="text" 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Periodo de Sueldo</label>
                  <select 
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.salaryPeriod}
                    onChange={(e) => setFormData({...formData, salaryPeriod: e.target.value})}
                  >
                    <option value="SEMANAL">Semanal</option>
                    <option value="QUINCENAL">Quincenal</option>
                    <option value="MENSUAL">Mensual</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Hora de Entrada (HH:MM)</label>
                  <input 
                    type="time" 
                    required
                    className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={formData.shiftStartTime}
                    onChange={(e) => setFormData({...formData, shiftStartTime: e.target.value})}
                  />
                </div>

              </form>
            </div>
            
            <div className="border-t border-border px-6 py-4 flex justify-end gap-3 bg-muted/20">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="employee-form"
                disabled={submitting}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Guardar Cambios' : 'Registrar Empleado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
