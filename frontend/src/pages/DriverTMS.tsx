import React, { useEffect } from 'react';
import { MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';
import { useTMSStore } from '../store/useTMSStore';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io(import.meta.env.PROD ? '' : 'http://localhost:3000');

export default function DriverTMS() {
  const { stops, markStopAs, loadTrip, syncOfflineData } = useTMSStore();
  
  useEffect(() => {
    // Cargar viaje al montar
    loadTrip();

    // Escuchar cambios de red para disparar la sincronización pendiente
    window.addEventListener('online', syncOfflineData);

    let watchId: number;
    if ('geolocation' in navigator) {
      // Uso de watchPosition es más eficiente que setInterval(getCurrentPosition)
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          // Solo enviar si la precisión es aceptable (ej. < 50 metros)
          // Esto evita rebotes de antena que drenan batería
          if (accuracy < 50) {
            // Emitir vía WebSocket en lugar de HTTP para ahorrar cabeceras TCP
            if (socket) {
              socket.emit('location_update', { lat: latitude, lng: longitude });
            }
          }
        },
        (error) => console.warn('Error GPS:', error),
        { 
          enableHighAccuracy: false, // False para ahorrar batería (usa celdas/wifi en lugar de GPS puro si es posible)
          maximumAge: 10000, 
          timeout: 5000 
        }
      );
    }

    return () => {
      window.removeEventListener('online', syncOfflineData);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const activeStop = stops.find(s => s.status === 'PENDING' || s.status === 'IN_TRANSIT');

  if (stops.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white p-4 items-center justify-center">
        <div className="animate-pulse text-xl">Buscando viajes asignados...</div>
      </div>
    );
  }

  if (!activeStop) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white p-4 items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">¡Ruta Completada! 🎉</h1>
        <p className="text-gray-400 text-center">Has completado todas las entregas de este viaje. Regresa a la base o espera nuevas asignaciones.</p>
      </div>
    );
  }

  const handleNavigate = () => {
    // Deeplink Universal: Abre Google Maps nativo en Android/iOS o Waze
    const url = `https://www.google.com/maps/dir/?api=1&destination=${activeStop.lat},${activeStop.lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Parada actual ({activeStop.sequence} de {stops.length})</h1>
        <p className="text-gray-400">Restan {stops.filter(s => s.status === 'PENDING').length} entregas</p>
      </header>

      <div className="flex-1 bg-gray-800 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-blue-400">{activeStop.customerName}</h2>
          
          <div className="flex items-start gap-3 text-gray-300 text-lg">
            <MapPin className="mt-1 flex-shrink-0 text-red-400" />
            <p>{activeStop.address}</p>
          </div>

          <div className="mt-6 flex gap-4">
            {activeStop.phone && (
              <a 
                href={`tel:${activeStop.phone}`}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-lg transition-colors active:scale-95"
              >
                <Phone size={24} /> Llamar
              </a>
            )}
            <button 
              onClick={handleNavigate}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold text-lg transition-colors active:scale-95"
            >
              <Navigation size={24} /> Navegar
            </button>
          </div>
        </div>

        {/* Botón de Acción Principal (Touch Target Gigante) */}
        <button 
          onClick={() => {
            const notes = prompt("¿Alguna nota de la entrega? (Opcional)");
            markStopAs(activeStop.id, 'DELIVERED', notes || undefined);
          }}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-2xl py-6 rounded-2xl shadow-lg mt-8 flex items-center justify-center gap-3 active:bg-indigo-700 transition-all active:scale-95"
        >
          <CheckCircle size={32} /> Registrar Entrega
        </button>
      </div>
    </div>
  );
}
