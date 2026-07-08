import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

const ChatContext = createContext({});
export const useChat2 = () => useContext(ChatContext);

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const token = localStorage.getItem('token');
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [onlineStaffCount, setOnlineStaffCount] = useState(0);

  // Customer chat state
  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isClosed, setIsClosed] = useState(false);

  // Staff chat state
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);

  const connect = useCallback(() => {
    if (!user || !token || socketRef.current?.connected) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('staff:online', count => setOnlineStaffCount(count));

    socket.on('message:new', msg => {
      setMessages(prev => [...prev, msg]);
      setActiveMessages(prev => [...prev, msg]);
    });

    socket.on('conversation:closed', () => setIsClosed(true));
    socket.on('notification:new', fetchNotifications);
  }, [user, token]);

  useEffect(() => {
    if (user && token) { connect(); }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  const joinConversation = useCallback((cId) => {
    setConvId(cId);
    socketRef.current?.emit('customer:join', cId);
  }, []);

  const joinStaffConversation = useCallback((cId) => {
    setActiveConvId(cId);
    socketRef.current?.emit('staff:join', cId);
  }, []);

  const sendMessage = useCallback((conversationId, content) => {
    socketRef.current?.emit('message:send', { conversationId, content });
  }, []);

  const closeConversation = useCallback((conversationId) => {
    socketRef.current?.emit('conversation:close', conversationId);
  }, []);

  return (
    <ChatContext.Provider value={{
      socket: socketRef.current,
      connected,
      onlineStaffCount,
      convId, setConvId,
      messages, setMessages,
      isClosed, setIsClosed,
      conversations, setConversations,
      activeConvId, setActiveConvId,
      activeMessages, setActiveMessages,
      joinConversation,
      joinStaffConversation,
      sendMessage,
      closeConversation,
    }}>
      {children}
    </ChatContext.Provider>
  );
};
