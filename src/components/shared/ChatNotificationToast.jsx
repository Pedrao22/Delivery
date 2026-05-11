import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X } from 'lucide-react';
import { useOrdersContext } from '../../context/OrdersContext';
import './ChatNotificationToast.css';

export default function ChatNotificationToast() {
  const { chatNotifications, dismissChatNotification } = useOrdersContext();
  const navigate = useNavigate();

  // Auto-dismiss após 8s
  useEffect(() => {
    if (chatNotifications.length === 0) return;
    const oldest = chatNotifications[chatNotifications.length - 1];
    const t = setTimeout(() => dismissChatNotification(oldest.id), 8000);
    return () => clearTimeout(t);
  }, [chatNotifications]);

  if (chatNotifications.length === 0) return null;

  return (
    <div className="chat-notif-stack">
      {chatNotifications.slice(0, 3).map((notif, i) => (
        <div
          key={notif.id}
          className="chat-notif-toast"
          style={{ zIndex: 9000 - i, transform: `scale(${1 - i * 0.04}) translateY(${i * 8}px)`, opacity: 1 - i * 0.25 }}
          onClick={() => {
            dismissChatNotification(notif.id);
            navigate('/atendimento');
          }}
        >
          <div className="chat-notif-icon">
            <MessageSquare size={18} />
          </div>
          <div className="chat-notif-body">
            <p className="chat-notif-name">{notif.contactName}</p>
            <p className="chat-notif-msg">{notif.message}</p>
          </div>
          <button
            className="chat-notif-close"
            onClick={e => { e.stopPropagation(); dismissChatNotification(notif.id); }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
