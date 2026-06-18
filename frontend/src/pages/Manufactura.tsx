import React, { useState } from 'react';
import { useAsync } from '../lib/hooks';
import { api, formatCurrency, formatTimestamp } from '../lib/api';
import { Plus, CheckCircle, Package, Hexagon, Loader2 } from 'lucide-react';

export default function Manufactura() {
  const { data: bomsData, loading: loadingBoms, execute: reloadBoms } = useAsync(() => api.get('/api/manufacturing/bom'), true);
  const { data: itemsData, loading: loadingItems } = useAsync(() => api.get('/api/items'), true);

  const boms = (bomsData as any)?.data || [];
  const items = (itemsData as any)?.data || [];

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProduceModal, setShowProduceModal] = useState(false);
  const [selectedBOM, setSelectedBOM] = useState<any>(null);

  // Form states for Create BOM
  const [finalItemId, setFinalItemId] = useState('');
  const [productionCost, setProductionCost] = useState('');
  const [components, setComponents] = useState<{ componentId: string; quantityRequired: number }[]>([{ componentId: '', quantityRequired: 1 }]);
  const [creating, setCreating] = useState(false);

  // Form states for Produce
  const [quantityToProduce, setQuantityToProduce] = useState('1');
  const [producing, setProducing] = useState(false);

  const handleAddComponent = () => {
    setComponents([...components, { componentId: '', quantityRequired: 1 }]);
  };

  const handleRemoveComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleComponentChange = (index: number, field: string, value: any) => {
    const newComponents = [...components];
    newComponents[index] = { ...newComponents[index], [field]: value };
    setComponents(newComponents);
  };

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await api.post('/api/manufacturing/bom', {
        itemId: finalItemId,
        productionCost: Number(productionCost) || 0,
        components: components.filter(c => c.componentId && c.quantityRequired > 0)
      });
      setShowCreateModal(false);
      setFinalItemId('');
      setProductionCost('');
      setComponents([{ componentId: '', quantityRequired: 1 }]);
      await reloadBoms();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear receta');
    } finally {
      setCreating(false);
    }
  };

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (producing) return;
    setProducing(true);
    try {
      await api.post('/api/manufacturing/production-order', {
        itemId: selectedBOM.itemId, // The backend expects itemId for production
        quantity: quantityToProduce
      });
      setShowProduceModal(false);
      setQuantityToProduce('1');
      await reloadBoms();
      alert('¡Producción registrada con éxito en el Kardex y Almacén!');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error en la producción');
    } finally {
      setProducing(false);
    }
  };

  if (loadingBoms || loadingItems) {
    return <div className="p-8 text-center text-muted-foreground">Cargando módulo de manufactura...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manufactura y Producción</h1>
          <p className="text-muted-foreground">Gestión de recetas (BOM), órdenes de producción y mermas.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Receta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boms.map((bom: any) => (
          <div key={bom.id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Hexagon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{bom.item.name}</h3>
                  <p className="text-xs text-muted-foreground">SKU: {bom.item.sku}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Materia Prima Necesaria</p>
              <ul className="space-y-2">
                {bom.components.map((comp: any) => (
                  <li key={comp.id} className="flex justify-between items-center text-sm">
                    <span className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{comp.component.name}</span>
                    </span>
                    <span className="font-medium bg-muted px-2 py-0.5 rounded text-xs">{comp.quantityRequired} unid.</span>
                  </li>
                ))}
              </ul>
              {bom.productionCost > 0 && (
                <div className="pt-2 border-t flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Costo de Operación:</span>
                  <span className="font-medium">{formatCurrency(bom.productionCost)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => { setSelectedBOM(bom); setShowProduceModal(true); }}
              className="w-full bg-primary/10 text-primary font-medium py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Producir Lote</span>
            </button>
          </div>
        ))}
        {boms.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
            No hay recetas registradas. Crea una para comenzar a manufacturar.
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border shadow-lg rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Crear Receta (BOM)</h3>
                <p className="text-sm text-muted-foreground">Define el producto final y su materia prima.</p>
              </div>
            </div>
            <form onSubmit={handleCreateBOM} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Producto a Fabricar (Final)</label>
                  <select
                    required
                    value={finalItemId}
                    onChange={(e) => setFinalItemId(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="">Seleccione producto...</option>
                    {items.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Costo de Producción ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ej. 150.00"
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value)}
                    className="w-full p-2.5 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <p className="text-xs text-muted-foreground">Costo operativo extra por unidad fabricada.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Materia Prima (Componentes)</label>
                  <button type="button" onClick={handleAddComponent} className="text-xs text-primary hover:underline font-medium">+ Agregar Material</button>
                </div>
                
                {components.map((comp, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-muted/50 p-3 rounded-lg border">
                    <div className="flex-1">
                      <select
                        required
                        value={comp.componentId}
                        onChange={(e) => handleComponentChange(index, 'componentId', e.target.value)}
                        className="w-full p-2 bg-background border rounded-md text-sm"
                      >
                        <option value="">Seleccionar material...</option>
                        {items.filter((i: any) => i.id !== finalItemId).map((item: any) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="1"
                        required
                        value={comp.quantityRequired}
                        onChange={(e) => handleComponentChange(index, 'quantityRequired', parseInt(e.target.value))}
                        className="w-full p-2 bg-background border rounded-md text-sm text-center"
                        placeholder="Cant."
                      />
                    </div>
                    <button type="button" onClick={() => handleRemoveComponent(index)} className="text-red-500 hover:text-red-600 p-2 text-sm font-bold">X</button>
                  </div>
                ))}
              </div>
            </form>
            <div className="p-6 border-t bg-muted/20 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border bg-background rounded-lg hover:bg-muted font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateBOM}
                disabled={creating}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Guardar Receta</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProduceModal && selectedBOM && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border shadow-lg rounded-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold">Producir: {selectedBOM.item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">Se descontarán los materiales del Kardex.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad a Producir</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityToProduce}
                  onChange={(e) => setQuantityToProduce(e.target.value)}
                  className="w-full p-3 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-xl font-bold text-center"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-semibold text-muted-foreground mb-2">Se consumirá:</p>
                {selectedBOM.components.map((c: any) => (
                  <div key={c.id} className="flex justify-between">
                    <span>{c.component.name}</span>
                    <span className="font-medium text-red-500">-{c.quantityRequired * Number(quantityToProduce)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t bg-muted/20 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowProduceModal(false)}
                className="px-4 py-2 border bg-background rounded-lg hover:bg-muted font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleProduce}
                disabled={producing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {producing ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Ejecutar Producción</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
