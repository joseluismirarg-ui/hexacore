import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: Date;
}

import { BASE_URL } from '../lib/api';

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Conectar a socket.io
    const socket: Socket = io(BASE_URL);

    socket.on('connect', () => {
      console.log('Connectado a WebSockets');
      // Unirse al room de admin (asumiendo que este es el dashboard de landlord/admin)
      socket.emit('join_admin_room');
    });

    socket.on('notification', (data: { title: string; message: string }) => {
      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title,
        message: data.message,
        time: new Date()
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Simple native toast (opcional)
      // alert(`${data.title}: ${data.message}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0); // Marcar como leídos al abrir
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={togglePanel}
        className="relative p-2 rounded-full bg-hc-surface-dark border border-gray-800 hover:bg-gray-800 transition-colors focus:outline-none"
      >
        <Bell className="h-5 w-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-hc-coral rounded-full animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-hc-surface-dark border border-gray-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in">
          <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-hc-surface">
            <h3 className="text-sm font-bold">Notificaciones</h3>
            {notifications.length > 0 && (
              <button 
                onClick={clearNotifications}
                className="text-xs text-gray-400 hover:text-white"
              >
                Limpiar todo
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No hay notificaciones nuevas
              </div>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <p className="text-sm font-bold text-white mb-1">{n.title}</p>
                    <p className="text-xs text-gray-400">{n.message}</p>
                    <p className="text-[10px] text-gray-600 mt-2">{n.time.toLocaleTimeString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
