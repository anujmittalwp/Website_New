import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useContent, SiteContent } from '../lib/useContent';
import { loginWithGoogle, logout } from '../lib/firebase';
import { Save, LogOut, Image as ImageIcon, Type, LayoutDashboard, MessageSquare, Send, User as UserIcon, Check, Wand2, Info, Globe2, Package, Mail, Phone, Trash2, Download, UserMinus, X, AlertCircle, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import ImageUploadCropper from '../components/ImageUploadCropper';
import * as XLSX from 'xlsx';
import emailjs from '@emailjs/browser';

interface ChatSession {
  id: string;
  userName: string;
  userEmail: string;
  status: string;
  createdAt: any;
  lastMessageAt: any;
}

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any;
  isAdmin: boolean;
}

const CloudinaryTools = ({ url, onUpdate }: { url: string; onUpdate: (newUrl: string) => void }) => {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) return null;

  const getParams = () => {
    const segments = url.split('/upload/');
    if (segments.length < 2) return { w: '', h: '' };
    const transformPart = segments[1].split('/')[0];
    if (transformPart.includes('f_') || transformPart.includes('w_')) {
      const wMatch = transformPart.match(/w_(\d+)/);
      const hMatch = transformPart.match(/h_(\d+)/);
      return { w: wMatch ? wMatch[1] : '', h: hMatch ? hMatch[1] : '' };
    }
    return { w: '', h: '' };
  };

  const { w, h } = getParams();

  const applyResize = (newW: string, newH: string) => {
    const segments = url.split('/upload/');
    const before = segments[0] + '/upload/';
    let rest = segments[1];
    
    const parts = rest.split('/');
    let hasTransform = parts[0].includes('f_') || parts[0].includes('w_') || parts[0].includes('q_');
    
    let transform = `f_auto,q_auto`;
    if (newW) transform += `,w_${newW}`;
    if (newH) transform += `,h_${newH}`;
    if (newW || newH) transform += `,c_fill`;

    if (hasTransform) {
      parts[0] = transform;
      onUpdate(before + parts.join('/'));
    } else {
      onUpdate(before + transform + '/' + rest);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-brand-paper rounded-xl border border-brand-ink/5 mt-2 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-bold text-brand-ink/40 uppercase tracking-tighter">Width</label>
        <input 
          type="number" 
          value={w} 
          onChange={(e) => applyResize(e.target.value, h)}
          placeholder="e.g. 1920"
          className="w-20 bg-white border border-brand-ink/5 rounded-lg px-2 py-1 text-[10px] focus:ring-1 focus:ring-brand-gold outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-bold text-brand-ink/40 uppercase tracking-tighter">Height</label>
        <input 
          type="number" 
          value={h} 
          onChange={(e) => applyResize(w, e.target.value)}
          placeholder="e.g. 600"
          className="w-20 bg-white border border-brand-ink/5 rounded-lg px-2 py-1 text-[10px] focus:ring-1 focus:ring-brand-gold outline-none"
        />
      </div>
      <div className="flex items-center text-[9px] text-brand-gold font-bold uppercase tracking-widest gap-1.5 ml-auto">
        <Wand2 className="w-3 h-3" />
        Cloudinary Optimizer
      </div>
    </div>
  );
};

export default function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const { content, loading: contentLoading, updateContent } = useContent();
  const [activeTab, setActiveTab] = useState<'content' | 'products' | 'export' | 'chats'>('content');
  const [formData, setFormData] = useState<SiteContent>(content);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Product states
  const [products, setProducts] = useState<any[]>([]);
  const [isSavingProduct, setIsSavingProduct] = useState<string | null>(null);
  
  // Inquiries states
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [exportSubTab, setExportSubTab] = useState<'leads' | 'settings'>('leads');
  const [leadsFilter, setLeadsFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'lost'>('all');

  const filteredInquiries = inquiries.filter(inq => {
    if (leadsFilter === 'all') return true;
    return (inq.status || 'new') === leadsFilter;
  });

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scraper state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState<string | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState<{current: number, total: number} | null>(null);

  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmDuplicates, setConfirmDuplicates] = useState(false);

  // Email and WhatsApp Actions state
  const [emailModalContext, setEmailModalContext] = useState<any>(null);
  const [whatsappModalContext, setWhatsappModalContext] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState("Following up on your inquiry");
  const [emailMessage, setEmailMessage] = useState("");
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [emailSendStatus, setEmailSendStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const handleEmailClick = (e: React.MouseEvent, inq: any) => {
    e.preventDefault();
    setEmailMessage(`Hi ${inq.name},\n\nThank you for your interest in our ${inq.product || 'products'}.\n\nBest regards,\nRCOM Oils & Solvex`);
    setEmailSubject("Following up on your inquiry");
    setEmailSendStatus(null);
    setEmailModalContext(inq);
  };

  const handleWhatsappClick = (e: React.MouseEvent, inq: any) => {
    e.preventDefault();
    setWhatsappMessage(`Hi ${inq.name},\nThis is RCOM Oils & Solvex regarding your inquiry for ${inq.product || 'products'}.`);
    setWhatsappModalContext(inq);
  };

  const sendEmailjs = async () => {
    setIsSendingEmail(true);
    setEmailSendStatus(null);
    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'dummy_service_id';
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'dummy_template_id';
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'dummy_public_key';
      
      if (serviceId === 'dummy_service_id' || !import.meta.env.VITE_EMAILJS_SERVICE_ID) {
         setEmailSendStatus({
           type: 'error',
           msg: 'Missing EmailJS Environment Variables! Please add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, and VITE_EMAILJS_PUBLIC_KEY in your deployment settings.'
         });
         setIsSendingEmail(false);
         return;
      } 
      
      await emailjs.send(serviceId, templateId, {
        to_name: emailModalContext.name,
        to_email: emailModalContext.email,
        subject: emailSubject,
        message: emailMessage,
      }, publicKey);
      
      // Update status to contacted
      if (emailModalContext.status === 'new') {
        await handleInquiryStatusChange(emailModalContext.id, 'contacted');
      }
      
      setEmailSendStatus({ type: 'success', msg: 'Email Sent Successfully!' });
      
      setTimeout(() => {
         setEmailModalContext(null);
         setEmailSendStatus(null);
      }, 2000); // Close automatically after 2s on success
    } catch (err: any) {
      console.error(err);
      setEmailSendStatus({ type: 'error', msg: `Failed to send email: ${err?.text || err?.message || 'Unknown error'}` });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendWhatsapp = () => {
    if (whatsappModalContext.status === 'new') {
      handleInquiryStatusChange(whatsappModalContext.id, 'contacted');
    }
    const phoneNum = whatsappModalContext.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${phoneNum}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, '_blank');
    setWhatsappModalContext(null);
  };

  // Update local form data when content loads
  useEffect(() => {
    if (!contentLoading) {
      setFormData(content);
    }
  }, [content, contentLoading]);

  // Listen for chat sessions
  useEffect(() => {
    if (activeTab !== 'chats') return;

    const q = query(collection(db, 'chat_sessions'), orderBy('lastMessageAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sess = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatSession[];
      setSessions(sess);
    });

    return unsubscribe;
  }, [activeTab]);

  // Listen for products
  useEffect(() => {
    if (activeTab !== 'products') return;

    const q = query(collection(db, 'products'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prodData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(prodData);
    });

    return unsubscribe;
  }, [activeTab]);

  // Listen for inquiries
  useEffect(() => {
    if (activeTab !== 'export') return; // Load inquiries when export tab is active

    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inqData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInquiries(inqData);
    });

    return unsubscribe;
  }, [activeTab]);

  // Listen for messages in selected session
  useEffect(() => {
    if (!selectedSession) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chat_messages'),
      where('sessionId', '==', selectedSession.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
      setMessages(msgs);
    });

    return unsubscribe;
  }, [selectedSession]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedSession || !user) return;

    const text = replyText.trim();
    setReplyText('');

    try {
      await addDoc(collection(db, 'chat_messages'), {
        sessionId: selectedSession.id,
        senderId: user.uid,
        senderName: 'RCOM Admin',
        text,
        timestamp: serverTimestamp(),
        isAdmin: true
      });

      await updateDoc(doc(db, 'chat_sessions', selectedSession.id), {
        lastMessageAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chat_messages');
    }
  };

  const handleProductChange = (productId: string, key: string, value: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, [key]: value } : p));
  };

  const handleProductSave = async (product: any) => {
    setIsSavingProduct(product.id);
    try {
      const { id, ...rest } = product;
      await updateDoc(doc(db, 'products', id), rest);
      setSaveMessage(`Product "${product.title}" updated!`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to update product.');
    } finally {
      setIsSavingProduct(null);
    }
  };

  const handleInquiryStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'inquiries', id), { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const clearScrapedData = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset after 3 seconds
      return;
    }
    
    setConfirmClear(false);
    setIsScraping(true);
    setScrapeStatus('Deleting scraped leads...');
    try {
      // Find all leads where message includes 'Scraped from AHCAB'
      const scrapedLeads = inquiries.filter(inq => typeof inq.message === 'string' && inq.message.includes('Scraped from AHCAB'));
      const deletePromises = scrapedLeads.map(lead => deleteDoc(doc(db, 'inquiries', lead.id)));
      await Promise.all(deletePromises);
      setScrapeStatus(`Successfully removed ${scrapedLeads.length} scraped leads.`);
    } catch (e) {
      console.error(e);
      setScrapeStatus('Error removing some leads.');
    } finally {
      setTimeout(() => {
        setIsScraping(false);
        setScrapeStatus(null);
      }, 3000);
    }
  };

  const removeDuplicates = async () => {
    if (!confirmDuplicates) {
      setConfirmDuplicates(true);
      setTimeout(() => setConfirmDuplicates(false), 3000); // Reset after 3 seconds
      return;
    }

    setConfirmDuplicates(false);
    setIsScraping(true);
    setScrapeStatus('Identifying duplicates...');
    
    try {
      const seen = new Set();
      const duplicatesToRemove: string[] = [];
      
      for (const inq of inquiries) {
        const uniqueKey = `${inq.company}-${inq.name}-${inq.email}`.toLowerCase();
        if (seen.has(uniqueKey)) {
          duplicatesToRemove.push(inq.id);
        } else {
          seen.add(uniqueKey);
        }
      }

      if (duplicatesToRemove.length === 0) {
        setScrapeStatus('No duplicates found.');
      } else {
        setScrapeStatus(`Deleting ${duplicatesToRemove.length} duplicates...`);
        const deletePromises = duplicatesToRemove.map(id => deleteDoc(doc(db, 'inquiries', id)));
        await Promise.all(deletePromises);
        setScrapeStatus(`Successfully removed ${duplicatesToRemove.length} duplicate leads.`);
      }
    } catch (e) {
      console.error(e);
      setScrapeStatus('Error removing duplicates.');
    } finally {
      setTimeout(() => {
        setIsScraping(false);
        setScrapeStatus(null);
      }, 3000);
    }
  };

  const handleExportExcel = () => {
    const data = filteredInquiries.map(inq => ({
      Name: inq.name || '',
      Company: inq.company || '',
      Email: inq.email || '',
      Phone: inq.phone || '',
      Country: inq.country || '',
      Product: inq.product || '',
      "Business Type": inq.businessType || '',
      Quantity: inq.quantity || '',
      Message: inq.message || '',
      Status: inq.status || '',
      Date: inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export Leads");
    XLSX.writeFile(wb, "RCOM_Export_Leads.xlsx");
  };

  const startScraping = () => {
    if (isScraping) return;
    setIsScraping(true);
    setScrapeStatus('Connecting to scraper...');
    setScrapeProgress(null);

    const eventSource = new EventSource('/api/scrape-ahcab');
    
    eventSource.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'info') {
          setScrapeStatus(data.message);
        } else if (data.status === 'progress') {
          setScrapeStatus(`Scraping members...`);
          setScrapeProgress({ current: data.current, total: data.total });
        } else if (data.status === 'error') {
          setScrapeStatus(`Error: ${data.message}`);
          eventSource.close();
          setIsScraping(false);
        } else if (data.status === 'done') {
          setScrapeStatus(`Saving ${data.results.length} leads to database...`);
          
          // Save to firestore sequentially or in batches (we'll do individually here since Firebase client SDK doesn't expose strict batching easily via this wrapper, but let's do Promise.all)
          try {
            const batchPromises = data.results.map((lead: any) => 
              addDoc(collection(db, 'inquiries'), {
                ...lead,
                status: 'new',
                createdAt: serverTimestamp()
              })
            );
            await Promise.all(batchPromises);
            setScrapeStatus('Scraping Complete! Leads successfully added.');
          } catch (e) {
            console.error(e);
            setScrapeStatus('Scraping finished but failed to save some leads.');
          }
          
          eventSource.close();
          setTimeout(() => {
            setIsScraping(false);
            setScrapeStatus(null);
            setScrapeProgress(null);
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to parse SSE', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('EventSource error:', err);
      eventSource.close();
      setIsScraping(false);
      setScrapeStatus('Connection to scraper lost.');
      setTimeout(() => setScrapeStatus(null), 3000);
    };
  };

  if (authLoading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if user is admin
  const ADMIN_EMAILS = ['rcomoilsandsolvex@gmail.com', 'anujkumarmittal@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper px-4">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-brand-ink/5 max-w-md w-full text-center">
          <LayoutDashboard className="w-16 h-16 text-brand-gold mx-auto mb-6" />
          <h1 className="text-3xl font-serif text-brand-ink mb-4">Admin Access</h1>
          <p className="text-brand-ink/60 font-light mb-8">Please sign in with your administrator account to access the content management panel.</p>
          <button onClick={loginWithGoogle} className="btn-premium btn-gold w-full">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper px-4">
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-brand-ink/5 max-w-md w-full text-center">
          <h1 className="text-3xl font-serif text-brand-ink mb-4">Access Denied</h1>
          <p className="text-brand-ink/60 font-light mb-8">Your account ({user.email}) does not have administrator privileges.</p>
          <button onClick={logout} className="btn-premium btn-outline w-full">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (key: keyof SiteContent, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      await updateContent(formData);
      setSaveMessage('Content updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save content. Check console for details.');
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    { key: 'homeHeroTitle', label: 'Home Hero Title', type: 'text', icon: Type },
    { key: 'homeHeroSubtitle', label: 'Home Hero Subtitle', type: 'text', icon: Type },
    { key: 'homeHeroImage', label: 'Home Hero Background Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1920 x 600 px' },
    { key: 'homeAboutTitle', label: 'Home About Section Title', type: 'text', icon: Type },
    { key: 'homeAboutText', label: 'Home About Section Text', type: 'textarea', icon: Type },
    { key: 'homeAboutImage', label: 'Home About Section Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1000 x 1000 px' },
    { key: 'aboutHeroTitle', label: 'About Page Hero Title', type: 'text', icon: Type },
    { key: 'aboutHeroSubtitle', label: 'About Page Hero Subtitle', type: 'text', icon: Type },
    { key: 'aboutHeroText', label: 'About Page Hero Text', type: 'textarea', icon: Type },
    { key: 'aboutHeroImage', label: 'About Page Hero Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1920 x 600 px' },
    { key: 'aboutImage', label: 'About Page Factory Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1000 x 1000 px' },
    { key: 'productsHeroTitle', label: 'Products Page Hero Title', type: 'text', icon: Type },
    { key: 'productsHeroSubtitle', label: 'Products Page Hero Subtitle', type: 'text', icon: Type },
    { key: 'productsHeroText', label: 'Products Page Hero Text', type: 'textarea', icon: Type },
    { key: 'productsHeroImage', label: 'Products Page Hero Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1920 x 600 px' },
    { key: 'contactHeroImage', label: 'Contact Page Hero Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1920 x 600 px' },
    { key: 'inquiryHeroImage', label: 'Inquiry Page Hero Image URL', type: 'image', icon: ImageIcon, hint: 'Best Size: 1920 x 600 px' },
  ];

  return (
    <div className="min-h-screen bg-brand-paper pb-24">
      {/* Admin Header */}
      <div className="bg-brand-ink text-white py-12 border-b border-white/5">
        <div className="container-custom flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-serif mb-2">Admin Dashboard</h1>
            <p className="text-brand-paper/60 font-light text-sm">Manage website content and live customer inquiries.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-white/10 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('content')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'content' ? 'bg-brand-gold text-brand-ink' : 'text-white hover:bg-white/5'}`}
              >
                Content
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-brand-gold text-brand-ink' : 'text-white hover:bg-white/5'}`}
              >
                Products
              </button>
              <button 
                onClick={() => setActiveTab('export')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'export' ? 'bg-brand-gold text-brand-ink' : 'text-white hover:bg-white/5'}`}
              >
                Export
              </button>
              <button 
                onClick={() => setActiveTab('chats')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center ${activeTab === 'chats' ? 'bg-brand-gold text-brand-ink' : 'text-white hover:bg-white/5'}`}
              >
                Live Chat {sessions.length > 0 && <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
              </button>
            </div>
            <div className="h-10 w-px bg-white/10 hidden md:block"></div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-light text-brand-gold hidden lg:inline">{user.email}</span>
              <button onClick={logout} className="flex items-center text-sm hover:text-brand-gold transition-colors">
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom mt-12">
        <AnimatePresence mode="wait">
          {activeTab === 'content' ? (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden"
            >
              <div className="p-8 md:p-12 space-y-10">
                {fields.map((field) => (
                  <div key={field.key} className="space-y-3">
                    <label className="flex items-center text-xs font-bold text-brand-ink uppercase tracking-widest">
                      <field.icon className="w-4 h-4 mr-2 text-brand-gold" />
                      {field.label}
                      {field.hint && <span className="ml-auto text-[10px] text-brand-gold lowercase font-medium">{field.hint}</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        rows={4}
                        className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light resize-none"
                      />
                    ) : field.type === 'image' ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                          <div className="flex flex-col gap-2 w-full">
                            <input
                              type="text"
                              value={formData[field.key] || ''}
                              onChange={(e) => handleChange(field.key, e.target.value)}
                              className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                              placeholder="https://..."
                            />
                            <ImageUploadCropper 
                              onUpload={(url) => handleChange(field.key, url)} 
                              label={`Upload & Crop ${field.label.split(' ')[0]}`}
                            />
                          </div>
                          {formData[field.key] && (
                            <div className="w-32 h-20 shrink-0 rounded-xl overflow-hidden bg-brand-paper border border-brand-ink/10">
                              <img src={formData[field.key]} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                        </div>
                        <CloudinaryTools 
                          url={formData[field.key] || ''} 
                          onUpdate={(newUrl) => handleChange(field.key, newUrl)} 
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={formData[field.key] || ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                      />
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-brand-paper/50 p-8 border-t border-brand-ink/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm font-medium h-6">
                  {saveMessage && (
                    <motion.span 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                      className={saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}
                    >
                      {saveMessage}
                    </motion.span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`btn-premium btn-gold flex items-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          ) : activeTab === 'products' ? (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden">
                  <div className="p-8 md:p-12">
                    <div className="flex flex-col lg:flex-row gap-12">
                      {/* Image Preview & Edit */}
                      <div className="lg:w-1/3 flex flex-col gap-8">
                        {/* Main Product Image (Expanded View) */}
                        <div className="space-y-4">
                          <label className="flex items-center text-xs font-bold text-brand-ink uppercase tracking-widest">
                            <ImageIcon className="w-4 h-4 mr-2 text-brand-gold" />
                            Main Product Image
                            <span className="ml-auto text-[10px] text-brand-gold lowercase font-medium">Best Size: 1200 x 900 px</span>
                          </label>
                          <div className="aspect-square rounded-3xl overflow-hidden border border-brand-ink/10 mb-4 relative">
                            {product.image ? (
                              <>
                                <img 
                                  src={product.image} 
                                  alt="" 
                                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-110" 
                                  aria-hidden="true"
                                  referrerPolicy="no-referrer" 
                                />
                                <img 
                                  src={product.image} 
                                  alt={product.title} 
                                  className="relative z-10 w-full h-full object-contain" 
                                  referrerPolicy="no-referrer" 
                                />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-ink/20">
                                <ImageIcon className="w-12 h-12" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 mt-2">
                            <input
                              type="text"
                              value={product.image || ''}
                              onChange={(e) => handleProductChange(product.id, 'image', e.target.value)}
                              className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light text-sm"
                              placeholder="Main Image URL (Full View)"
                            />
                            <ImageUploadCropper 
                              onUpload={(url) => handleProductChange(product.id, 'image', url)} 
                              aspectRatio={1}
                              label="Upload & Crop Main Image (1:1)"
                            />
                          </div>
                          <CloudinaryTools 
                            url={product.image || ''} 
                            onUpdate={(newUrl) => handleProductChange(product.id, 'image', newUrl)} 
                          />
                        </div>

                        {/* Product Card Image (Grid View) */}
                        <div className="space-y-4">
                          <label className="flex items-center text-xs font-bold text-brand-ink uppercase tracking-widest">
                            <ImageIcon className="w-4 h-4 mr-2 text-brand-gold" />
                            Product Card Image
                            <span className="ml-auto text-[10px] text-brand-gold lowercase font-medium">Visible in Grid</span>
                          </label>
                          <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-brand-ink/10 mb-4 relative">
                            {product.cardImage || product.image ? (
                              <>
                                <img 
                                  src={product.cardImage || product.image} 
                                  alt="" 
                                  className="absolute inset-0 w-full h-full object-cover blur-xl opacity-20 scale-110" 
                                  aria-hidden="true"
                                  referrerPolicy="no-referrer" 
                                />
                                <img 
                                  src={product.cardImage || product.image} 
                                  alt={product.title} 
                                  className="relative z-10 w-full h-full object-contain" 
                                  referrerPolicy="no-referrer" 
                                />
                              </>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-ink/20">
                                <ImageIcon className="w-12 h-12" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 mt-2">
                            <input
                              type="text"
                              value={product.cardImage || ''}
                              onChange={(e) => handleProductChange(product.id, 'cardImage', e.target.value)}
                              className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light text-sm"
                              placeholder="Card Image URL (Optional - defaults to main)"
                            />
                            <ImageUploadCropper 
                              onUpload={(url) => handleProductChange(product.id, 'cardImage', url)} 
                              aspectRatio={4/3}
                              label="Upload & Crop Card Image (4:3)"
                            />
                          </div>
                          <CloudinaryTools 
                            url={product.cardImage || ''} 
                            onUpdate={(newUrl) => handleProductChange(product.id, 'cardImage', newUrl)} 
                          />
                        </div>
                      </div>

                      {/* Details Edit */}
                      <div className="lg:w-2/3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Title</label>
                            <input
                              type="text"
                              value={product.title}
                              onChange={(e) => handleProductChange(product.id, 'title', e.target.value)}
                              className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Subtitle</label>
                            <input
                              type="text"
                              value={product.subtitle}
                              onChange={(e) => handleProductChange(product.id, 'subtitle', e.target.value)}
                              className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Description</label>
                          <textarea
                            value={product.description}
                            onChange={(e) => handleProductChange(product.id, 'description', e.target.value)}
                            rows={3}
                            className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light resize-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Packaging</label>
                          <input
                            type="text"
                            value={product.packaging}
                            onChange={(e) => handleProductChange(product.id, 'packaging', e.target.value)}
                            className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">HS Code (Export)</label>
                          <input
                            type="text"
                            value={product.hsCode || ''}
                            onChange={(e) => handleProductChange(product.id, 'hsCode', e.target.value)}
                            placeholder="e.g. 151411 (Optional)"
                            className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">Minimum Order Qty (Export)</label>
                          <input
                            type="text"
                            value={product.exportMoq || ''}
                            onChange={(e) => handleProductChange(product.id, 'exportMoq', e.target.value)}
                            placeholder="e.g. 1 x 20ft Container"
                            className="w-full bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                          />
                        </div>

                        <div className="pt-4 flex justify-end">
                          <button
                            onClick={() => handleProductSave(product)}
                            disabled={isSavingProduct === product.id}
                            className={`btn-premium btn-gold flex items-center px-8 py-3 ${isSavingProduct === product.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {isSavingProduct === product.id ? 'Saving...' : 'Update Product'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          ) : activeTab === 'export' ? (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* EXPORT SUB-NAV */}
              <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-brand-ink/5 w-max">
                <button 
                  onClick={() => setExportSubTab('leads')}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${exportSubTab === 'leads' ? 'bg-brand-ink text-brand-gold' : 'text-brand-ink/60 hover:text-brand-ink'}`}
                >
                  Export Leads
                </button>
                <button 
                  onClick={() => setExportSubTab('settings')}
                  className={`px-8 py-3 rounded-xl text-sm font-bold transition-all ${exportSubTab === 'settings' ? 'bg-brand-ink text-brand-gold' : 'text-brand-ink/60 hover:text-brand-ink'}`}
                >
                  Page Settings
                </button>
              </div>

              {exportSubTab === 'leads' ? (
                <div className="bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden p-8 md:p-12">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                      <h2 className="text-2xl font-serif text-brand-ink flex items-center gap-3">
                        <Globe2 className="w-6 h-6 text-brand-gold" />
                        Export Inquiries
                      </h2>
                      <p className="text-brand-ink/60 text-sm mt-1">Manage bulk requests and international leads.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {scrapeStatus && (
                        <div className="text-sm text-brand-gold font-bold flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-brand-gold animate-ping"></span>
                          {scrapeStatus}
                          {scrapeProgress && ` (${scrapeProgress.current}/${scrapeProgress.total})`}
                        </div>
                      )}
                      <button 
                        onClick={clearScrapedData}
                        disabled={isScraping}
                        className={`text-sm px-4 py-2 font-bold rounded-xl border border-red-500/10 flex items-center gap-2 transition-colors ${
                          isScraping 
                            ? 'bg-brand-paper text-brand-ink/50 cursor-not-allowed' 
                            : confirmClear 
                              ? 'bg-red-600 text-white shadow-lg' 
                              : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'
                        }`}
                        title="Remove all scraped leads"
                      >
                        <Trash2 className="w-4 h-4" />
                        {confirmClear ? "Click to Confirm Delete" : ""}
                      </button>
                      <button 
                        onClick={startScraping}
                        disabled={isScraping}
                        className={`text-sm px-4 py-2 font-bold rounded-xl border border-brand-ink/10 flex items-center gap-2 transition-colors ${
                          isScraping 
                            ? 'bg-brand-paper text-brand-ink/50 cursor-not-allowed' 
                            : 'bg-white text-brand-ink hover:bg-brand-ink hover:text-white'
                        }`}
                      >
                        <Globe2 className="w-4 h-4" />
                        {isScraping ? 'Scraping...' : 'Scrape AHCAB Members'}
                      </button>
                      <button 
                        onClick={removeDuplicates}
                        disabled={isScraping || inquiries.length === 0}
                        className={`text-sm px-4 py-2 font-bold rounded-xl border border-brand-ink/10 flex items-center gap-2 transition-colors ${
                          (isScraping || inquiries.length === 0)
                            ? 'bg-brand-paper text-brand-ink/50 cursor-not-allowed' 
                            : confirmDuplicates
                              ? 'bg-brand-ink text-white shadow-lg'
                              : 'bg-white text-brand-ink hover:bg-brand-ink hover:text-white'
                        }`}
                        title="Remove Duplicate Leads"
                      >
                        <UserMinus className="w-4 h-4" />
                        {confirmDuplicates ? "Click to Confirm Cleanup" : "Remove Duplicates"}
                      </button>
                      <button 
                        onClick={handleExportExcel}
                        disabled={filteredInquiries.length === 0}
                        className={`text-sm px-4 py-2 font-bold rounded-xl border border-brand-ink/10 flex items-center gap-2 transition-colors ${
                          filteredInquiries.length === 0 
                            ? 'bg-brand-paper text-brand-ink/50 cursor-not-allowed' 
                            : 'bg-brand-gold text-brand-ink hover:bg-brand-gold/80'
                        }`}
                      >
                        <Download className="w-4 h-4" />
                        Export Excel
                      </button>
                    </div>
                  </div>

                  {/* Leads Filter Tabs */}
                  <div className="flex bg-brand-paper p-1 rounded-xl w-max mb-8 border border-brand-ink/5 relative z-10 overflow-x-auto max-w-full">
                    <div className="flex items-center gap-2 px-4 text-brand-ink/40 font-bold text-xs uppercase tracking-widest border-r border-brand-ink/10 mr-1">
                      <Filter className="w-3 h-3" />
                      Filter
                    </div>
                    {(['all', 'new', 'contacted', 'converted', 'lost'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setLeadsFilter(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest transition-all ${
                          leadsFilter === tab 
                            ? 'bg-white text-brand-ink shadow-sm' 
                            : 'text-brand-ink/40 hover:text-brand-ink/80 hover:bg-white/50'
                        }`}
                      >
                        {tab}
                        <span className="ml-2 text-[10px] bg-brand-ink/5 px-2 py-0.5 rounded-full">
                          {tab === 'all' 
                            ? inquiries.length 
                            : inquiries.filter(i => (i.status || 'new') === tab).length}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {filteredInquiries.length === 0 ? (
                      <div className="text-center py-12 text-brand-ink/40">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No export inquiries found matching this filter.</p>
                      </div>
                    ) : (
                      filteredInquiries.map((inq) => (
                        <div key={inq.id} className="bg-brand-paper p-6 rounded-3xl border border-brand-ink/5 flex flex-col lg:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-bold text-lg text-brand-ink">{inq.name}</h3>
                                <p className="text-brand-ink/60 text-sm">{inq.company} • {inq.country}</p>
                              </div>
                              <select
                                value={inq.status || 'new'}
                                onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors outline-none cursor-pointer border-r-8 border-transparent ${
                                  (inq.status || 'new') === 'new' ? 'bg-red-100 text-red-600' :
                                  inq.status === 'contacted' ? 'bg-yellow-100 text-yellow-600' :
                                  inq.status === 'converted' ? 'bg-green-100 text-green-600' :
                                  'bg-gray-200 text-gray-700'
                                }`}
                              >
                                <option value="new">NEW</option>
                                <option value="contacted">CONTACTED</option>
                                <option value="converted">CONVERTED</option>
                                <option value="lost">LOST</option>
                              </select>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm bg-white p-4 rounded-2xl border border-brand-ink/5">
                              {inq.businessType && inq.businessType !== 'N/A' && (
                                <div className="flex items-center gap-2 text-brand-gold bg-brand-gold/5 px-3 py-1 rounded-lg">
                                  <span className="font-bold">{inq.businessType}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-brand-gold" />
                                <span className="font-bold">{inq.product}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-brand-ink/40 uppercase text-[10px] tracking-widest">Qty:</span>
                                <span>{inq.quantity}</span>
                              </div>
                            </div>
                            
                            {inq.message && (
                              <div className="text-sm text-brand-ink/80 italic border-l-4 border-brand-gold pl-4">
                                "{inq.message}"
                              </div>
                            )}
                          </div>
                          
                          <div className="w-full lg:w-64 space-y-3 bg-white p-6 rounded-2xl shadow-sm border border-brand-ink/5 h-max">
                            <div className="text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest mb-4">Contact Info</div>
                            <div className="flex items-center gap-3 text-sm">
                              <Mail className="w-4 h-4 text-brand-gold" />
                              <a href="#" onClick={(e) => handleEmailClick(e, inq)} className="hover:text-brand-gold break-all">{inq.email}</a>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <Phone className="w-4 h-4 text-brand-gold" />
                              <a href="#" onClick={(e) => handleWhatsappClick(e, inq)} className="hover:text-brand-gold">{inq.phone}</a>
                            </div>
                            <div className="text-xs text-brand-ink/40 mt-4 pt-4 border-t border-brand-ink/5 text-right">
                              {inq.createdAt?.toDate().toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden">
                  <div className="p-8 md:p-12 space-y-10">
                    <div className="flex items-center gap-4 mb-4">
                      <Globe2 className="w-8 h-8 text-brand-gold" />
                      <h2 className="text-2xl font-serif">Export Page Editor</h2>
                    </div>

                    {/* BASIC INFO */}
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-brand-ink uppercase tracking-widest">Export Page Title</label>
                    <input 
                      type="text" 
                      value={formData.exportTitle || ''} 
                      onChange={(e) => handleChange('exportTitle', e.target.value)} 
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold font-light" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-brand-ink uppercase tracking-widest">Export Page Subtitle</label>
                    <input 
                      type="text" 
                      value={formData.exportSubtitle || ''} 
                      onChange={(e) => handleChange('exportSubtitle', e.target.value)} 
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold font-light" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-brand-ink uppercase tracking-widest">Export Hero Text</label>
                    <textarea 
                      value={formData.exportText || ''} 
                      onChange={(e) => handleChange('exportText', e.target.value)} 
                      rows={3} 
                      className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold font-light resize-none" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-brand-ink uppercase tracking-widest">Export Hero Image URL</label>
                    <div className="flex flex-col gap-4">
                        <div className="w-full h-48 bg-brand-paper rounded-3xl overflow-hidden border border-brand-ink/10 relative">
                          {formData.exportHeroImage && (
                            <img src={formData.exportHeroImage} alt="Export Hero" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <input 
                            type="text" 
                            value={formData.exportHeroImage || ''} 
                            onChange={(e) => handleChange('exportHeroImage', e.target.value)} 
                            className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold font-light" 
                          />
                          <ImageUploadCropper 
                            onUpload={(url) => handleChange('exportHeroImage', url)} 
                            label="Upload & Crop Export Hero Image"
                          />
                        </div>
                    </div>
                  </div>
                </div>

                {/* TARGET REGIONS */}
                <div className="pt-8 border-t border-brand-ink/5">
                  <h3 className="text-xl font-serif mb-6 text-brand-ink">Target Export Regions</h3>
                  <div className="space-y-4">
                    {(formData.exportRegions || []).map((region: string, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <input 
                          type="text" 
                          value={region} 
                          onChange={(e) => {
                            const newRegions = [...(formData.exportRegions || [])];
                            newRegions[idx] = e.target.value;
                            handleChange('exportRegions', newRegions as any);
                          }} 
                          className="flex-grow bg-brand-paper border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-gold font-light" 
                        />
                        <button 
                          onClick={() => {
                            const newRegions = (formData.exportRegions || []).filter((_: any, i: number) => i !== idx);
                            handleChange('exportRegions', newRegions as any);
                          }}
                          className="px-4 bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleChange('exportRegions', [...(formData.exportRegions || []), ''] as any)} 
                      className="px-6 py-3 bg-brand-ink text-white rounded-xl text-sm font-bold hover:bg-brand-gold hover:text-brand-ink transition-colors"
                    >
                      + Add Region
                    </button>
                  </div>
                </div>

                {/* CERTIFICATIONS */}
                <div className="pt-8 border-t border-brand-ink/5">
                  <h3 className="text-xl font-serif mb-6 text-brand-ink">Certifications / Standards</h3>
                  <div className="space-y-6">
                    {(formData.exportCerts || []).map((cert: any, idx: number) => (
                      <div key={idx} className="flex gap-4 items-center bg-brand-paper p-4 rounded-2xl border border-brand-ink/5">
                        <div className="flex-grow space-y-3">
                          <input 
                            type="text" 
                            placeholder="Title (e.g. ISO 9001:2015)"
                            value={cert.title} 
                            onChange={(e) => {
                              const newCerts = [...(formData.exportCerts || [])];
                              newCerts[idx] = { ...newCerts[idx], title: e.target.value };
                              handleChange('exportCerts', newCerts as any);
                            }} 
                            className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-2 font-bold" 
                          />
                          <input 
                            type="text" 
                            placeholder="Subtitle (e.g. Quality Management)"
                            value={cert.subtitle} 
                            onChange={(e) => {
                              const newCerts = [...(formData.exportCerts || [])];
                              newCerts[idx] = { ...newCerts[idx], subtitle: e.target.value };
                              handleChange('exportCerts', newCerts as any);
                            }} 
                            className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-2 font-light text-sm" 
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newCerts = (formData.exportCerts || []).filter((_: any, i: number) => i !== idx);
                            handleChange('exportCerts', newCerts as any);
                          }}
                          className="px-4 h-full bg-red-100 text-red-600 rounded-xl hover:bg-red-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => handleChange('exportCerts', [...(formData.exportCerts || []), { title: '', subtitle: '' }] as any)} 
                      className="px-6 py-3 bg-brand-ink text-white rounded-xl text-sm font-bold hover:bg-brand-gold hover:text-brand-ink transition-colors"
                    >
                      + Add Certification
                    </button>
                  </div>
                </div>

              </div>

              {/* SAVE STRIP */}
              <div className="bg-brand-paper/50 p-8 border-t border-brand-ink/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-sm font-medium h-6">
                  {saveMessage && (
                    <motion.span 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
                      className={saveMessage.includes('Failed') ? 'text-red-500' : 'text-green-600'}
                    >
                      {saveMessage}
                    </motion.span>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`btn-premium btn-gold flex items-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Export Settings'}
                </button>
              </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[700px]"
            >
              {/* Sessions List */}
              <div className="bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden flex flex-col">
                <div className="p-8 border-b border-brand-ink/5">
                  <h3 className="text-xl font-serif text-brand-ink">Active Sessions</h3>
                </div>
                <div className="flex-grow overflow-y-auto">
                  {sessions.length === 0 ? (
                    <div className="p-12 text-center text-brand-ink/40">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="text-sm">No active chat sessions.</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`w-full p-6 text-left border-b border-brand-ink/5 transition-all hover:bg-brand-paper/50 ${selectedSession?.id === session.id ? 'bg-brand-paper border-l-4 border-l-brand-gold' : ''}`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-brand-ink text-sm">{session.userName}</span>
                          <span className="text-[10px] text-brand-ink/40 uppercase font-bold">
                            {session.lastMessageAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-brand-ink/60 truncate">{session.userEmail}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="lg:col-span-2 bg-white rounded-[40px] shadow-xl border border-brand-ink/5 overflow-hidden flex flex-col">
                {selectedSession ? (
                  <>
                    <div className="p-8 border-b border-brand-ink/5 flex justify-between items-center bg-brand-paper/30">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center mr-4">
                          <UserIcon className="w-6 h-6 text-brand-ink" />
                        </div>
                        <div>
                          <h3 className="text-xl font-serif text-brand-ink">{selectedSession.userName}</h3>
                          <p className="text-xs text-brand-ink/50">{selectedSession.userEmail}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-8 space-y-6 bg-brand-paper/10">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] p-5 rounded-3xl text-sm ${
                            msg.isAdmin 
                              ? 'bg-brand-ink text-white rounded-br-none shadow-lg' 
                              : 'bg-white text-brand-ink rounded-bl-none shadow-md border border-brand-ink/5'
                          }`}>
                            <p className="leading-relaxed">{msg.text}</p>
                            <div className={`text-[9px] mt-2 opacity-40 flex items-center ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                              {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {msg.isAdmin && <Check className="w-2 h-2 ml-1" />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="p-8 border-t border-brand-ink/5">
                      <form onSubmit={handleSendReply} className="flex items-center gap-4">
                        <input
                          type="text"
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="flex-grow bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all font-light"
                        />
                        <button type="submit" className="btn-premium btn-gold !p-4">
                          <Send className="w-6 h-6" />
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-brand-ink/30 p-12 text-center">
                    <MessageSquare className="w-24 h-24 mb-6 opacity-10" />
                    <h3 className="text-2xl font-serif mb-2">Select a Conversation</h3>
                    <p className="max-w-xs text-sm">Choose a chat session from the list on the left to start replying to customer inquiries.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Email Modal */}
      <AnimatePresence>
        {emailModalContext && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setEmailModalContext(null)}
                className="absolute top-6 right-6 text-brand-ink/40 hover:text-brand-ink transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-serif text-brand-ink mb-2">Send Email via EmailJS</h2>
              <p className="text-sm text-brand-ink/60 mb-6">Drafting email to <strong>{emailModalContext.email}</strong></p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brand-ink uppercase tracking-widest block mb-2">Subject</label>
                  <input 
                    type="text" 
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-ink uppercase tracking-widest block mb-2">Message Body</label>
                  <textarea 
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={6}
                    className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-brand-gold transition-all resize-none"
                  />
                </div>
                
                {emailSendStatus && (
                  <div className={`p-4 rounded-xl flex items-start gap-3 text-sm ${emailSendStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {emailSendStatus.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                    <p className="font-medium pt-0.5">{emailSendStatus.msg}</p>
                  </div>
                )}
                
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setEmailModalContext(null)}
                    className="px-6 py-3 rounded-xl font-bold text-brand-ink/60 hover:bg-brand-paper transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={sendEmailjs}
                    disabled={isSendingEmail}
                    className="btn-premium btn-gold flex items-center"
                  >
                    {isSendingEmail ? 'Sending...' : 'Confirm & Send Email'}
                    <Send className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WhatsApp Modal */}
      <AnimatePresence>
        {whatsappModalContext && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-brand-ink/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] max-w-sm w-full max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl"
            >
              <button 
                onClick={() => setWhatsappModalContext(null)}
                className="absolute top-6 right-6 text-brand-ink/40 hover:text-brand-ink transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-serif text-brand-ink mb-2">Send WhatsApp</h2>
              <p className="text-sm text-brand-ink/60 mb-6">Messaging <strong>{whatsappModalContext.phone}</strong></p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brand-ink uppercase tracking-widest block mb-2">Message</label>
                  <textarea 
                    value={whatsappMessage}
                    onChange={(e) => setWhatsappMessage(e.target.value)}
                    rows={4}
                    className="w-full bg-brand-paper border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-500 transition-all resize-none"
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setWhatsappModalContext(null)}
                    className="px-6 py-3 rounded-xl font-bold text-brand-ink/60 hover:bg-brand-paper transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={sendWhatsapp}
                    className="px-6 py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center"
                  >
                    Open WhatsApp
                    <Send className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
