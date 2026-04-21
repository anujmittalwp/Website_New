import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Clock, Check } from 'lucide-react';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isAdmin: boolean;
}

export default function LiveChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('chat_session_id'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userName, setUserName] = useState(localStorage.getItem('chat_user_name') || '');
  const [userEmail, setUserEmail] = useState(localStorage.getItem('chat_user_email') || '');
  const [isIdentifying, setIsIdentifying] = useState(!sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check business hours (IST: UTC+5:30)
  useEffect(() => {
    const checkStatus = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const ist = new Date(utc + (3600000 * 5.5));
      
      const day = ist.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hours = ist.getHours();
      
      // Mon-Sat: 9 AM - 6 PM
      const isWorkDay = day >= 1 && day <= 6;
      const isWorkHours = hours >= 9 && hours < 18;
      
      setIsOnline(isWorkDay && isWorkHours);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Listen for messages
  useEffect(() => {
    if (!sessionId) return;

    const q = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', sessionId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat_messages');
    });

    return unsubscribe;
  }, [sessionId]);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userEmail) return;

    try {
      const sessionRef = await addDoc(collection(db, 'chat_sessions'), {
        userName,
        userEmail,
        userId: user?.uid || 'anonymous',
        status: 'active',
        createdAt: serverTimestamp(),
        lastMessageAt: serverTimestamp(),
        isOnlineAtStart: isOnline
      });

      const newSessionId = sessionRef.id;
      setSessionId(newSessionId);
      localStorage.setItem('chat_session_id', newSessionId);
      localStorage.setItem('chat_user_name', userName);
      localStorage.setItem('chat_user_email', userEmail);
      setIsIdentifying(false);

      // Initial system message
      await addDoc(collection(db, 'chat_messages'), {
        sessionId: newSessionId,
        senderId: 'system',
        senderName: 'System',
        text: isOnline 
          ? `Hello ${userName}! An export manager will be with you shortly.`
          : `Hello ${userName}! We are currently offline. Please leave your message and we will get back to you via email.`,
        timestamp: serverTimestamp(),
        isAdmin: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_sessions');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !sessionId) return;

    const text = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        sessionId,
        senderId: user?.uid || 'anonymous',
        senderName: userName,
        text,
        timestamp: serverTimestamp(),
        isAdmin: false
      });

      await updateDoc(doc(db, 'chat_sessions', sessionId), {
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-white rounded-[32px] shadow-2xl border border-brand-ink/5 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-ink p-6 text-white flex justify-between items-center">
              <div className="flex items-center">
                <div className="relative mr-3">
                  <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-brand-ink" />
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-brand-ink ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <div>
                  <h3 className="font-serif text-lg leading-tight">RCOM Support</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-60 font-bold">
                    {isOnline ? 'Online • Export Manager' : 'Offline • Leave a Message'}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-6 bg-brand-paper/30">
              {isIdentifying ? (
                <div className="h-full flex flex-col justify-center">
                  <h4 className="text-brand-ink font-serif text-xl mb-2 text-center">How can we help?</h4>
                  <p className="text-brand-ink/50 text-xs text-center mb-8">Please introduce yourself to start the chat.</p>
                  <form onSubmit={startSession} className="space-y-4">
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                    />
                    <input
                      type="email"
                      required
                      placeholder="Your Email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-gold outline-none transition-all"
                    />
                    <button type="submit" className="btn-premium btn-gold w-full py-3 text-sm">
                      Start Conversation
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                        msg.isAdmin 
                          ? 'bg-white text-brand-ink rounded-bl-none shadow-sm border border-brand-ink/5' 
                          : 'bg-brand-gold text-brand-ink rounded-br-none shadow-md'
                      }`}>
                        <p className="leading-relaxed">{msg.text}</p>
                        <div className={`text-[9px] mt-1 opacity-40 flex items-center ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                          {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {!msg.isAdmin && <Check className="w-2 h-2 ml-1" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Footer */}
            {!isIdentifying && (
              <div className="p-4 bg-white border-t border-brand-ink/5">
                <form onSubmit={sendMessage} className="flex items-center bg-brand-paper rounded-2xl px-4 py-2">
                  <input
                    type="text"
                    placeholder={isOnline ? "Type your message..." : "Leave a message..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-grow bg-transparent border-none outline-none text-sm py-2"
                  />
                  <button type="submit" className="ml-2 text-brand-gold hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
                <div className="mt-2 flex items-center justify-center text-[8px] uppercase tracking-widest text-brand-ink/30 font-bold">
                  <Clock className="w-2 h-2 mr-1" /> Business Hours: 9 AM - 6 PM IST (Mon-Sat)
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 ${
          isOpen ? 'bg-brand-ink text-white' : 'bg-brand-gold text-brand-ink'
        }`}
      >
        {isOpen ? <X className="w-8 h-8" /> : <MessageCircle className="w-8 h-8" />}
        {!isOpen && (
          <div className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-green-400' : 'bg-brand-gold'}`}></span>
            <span className={`relative inline-flex rounded-full h-5 w-5 border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-brand-gold'}`}></span>
          </div>
        )}
      </button>
    </div>
  );
}
