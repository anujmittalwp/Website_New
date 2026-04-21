import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Globe, ShieldCheck, Truck, BarChart3, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useContent } from '../lib/useContent';

interface Product {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export default function Home() {
  const { content } = useContent();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('order', 'asc'), limit(3));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        subtitle: doc.data().subtitle,
        image: doc.data().image
      })) as Product[];
      
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return unsubscribe;
  }, []);
  return (
    <div>
      {/* Hero Section - Exact Match to Screenshot */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full">
          <img
            src={content.homeHeroImage || "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=2000"}
            alt="RCOM Mustard Excellence"
            className="w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1] object-cover block"
            referrerPolicy="no-referrer"
          />
          {/* Subtle Overlay for readability */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center z-10">
          <div className="container-custom w-full">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-2xl flex flex-col items-start text-left"
            >
              <h1 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {content.homeHeroTitle.split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {content.homeHeroSubtitle}
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                High Quality | Bulk Supply | Worldwide Export
              </p>

              <Link 
                to="/inquiry" 
                className="inline-block bg-[#23532a] hover:bg-[#1a3d1f] text-white text-sm lg:text-base font-bold px-6 lg:px-10 py-2.5 lg:py-3.5 rounded-xl shadow-[0_4px_0_rgb(21,47,24)] active:translate-y-[2px] active:shadow-none transition-all self-start"
              >
                Get A Quote
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Intro Section - Minimal & Elegant */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-1 hidden lg:block">
              <div className="vertical-text">SINCE 2014</div>
            </div>
            <div className="lg:col-span-5">
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Our Legacy</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-brand-ink leading-tight mb-8">
                {content.homeAboutTitle.split(' ').map((word, i, arr) => 
                  i === arr.length - 2 ? <span key={i} className="italic">{word} </span> : <span key={i}>{word} </span>
                )}
              </h3>
              <p className="text-brand-ink/70 leading-relaxed mb-8 text-lg font-light">
                {content.homeAboutText}
              </p>
              <Link to="/about" className="group inline-flex items-center text-brand-ink font-sans text-xs font-bold uppercase tracking-widest">
                Our Story <ArrowRight className="ml-3 w-4 h-4 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
            <div className="lg:col-span-6">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[60px] rounded-tr-none shadow-2xl bg-brand-ink/5">
                <img
                  src={content.homeAboutImage || "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000"}
                  alt="Manufacturing Plant"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase - Luxury Grid */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
            <div className="max-w-xl">
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">The Collection</h2>
              <h3 className="text-4xl md:text-5xl font-serif text-brand-ink leading-tight">
                Our Signature <span className="italic">Mustard</span> Portfolio.
              </h3>
            </div>
            <Link to="/products" className="mt-8 md:mt-0 btn-premium btn-outline">
              View All Products
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-brand-ink/10">
            {products.map((product, idx) => (
              <motion.div
                key={product.id}
                whileHover={{ backgroundColor: "#f5f2ed" }}
                className="group p-12 border-r last:border-r-0 border-brand-ink/10 transition-colors duration-500"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-3xl mb-10 shadow-xl group-hover:scale-105 transition-all duration-700">
                  {product.image ? (
                    <img src={product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-ink/10">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <p className="text-brand-gold font-sans text-[9px] font-bold uppercase tracking-widest mb-3">{product.subtitle}</p>
                <h4 className="text-2xl font-serif text-brand-ink mb-6">{product.title}</h4>
                <Link to="/products" className="inline-flex items-center text-brand-ink/40 group-hover:text-brand-gold transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us - Prestige Stats */}
      <section className="section-padding bg-brand-ink text-white overflow-hidden">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-brand-gold font-sans font-bold uppercase tracking-[0.2em] text-[10px] mb-6">Why Partner With Us</h2>
              <h3 className="text-4xl md:text-5xl font-serif leading-tight mb-12">
                Uncompromising <span className="italic">Standards</span> for Global Trade.
              </h3>
              
              <div className="space-y-12">
                {[
                  { title: "Artisanal Precision", desc: "Every batch is monitored by experts to ensure the perfect balance of pungency and purity." },
                  { title: "Global Logistics", desc: "Seamless containerized shipping to over 15 countries across three continents." },
                  { title: "Ethical Sourcing", desc: "We work directly with local farmers to ensure the highest quality raw materials." }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start group">
                    <span className="text-brand-gold font-serif text-2xl mr-8 opacity-40 group-hover:opacity-100 transition-opacity">0{idx + 1}</span>
                    <div>
                      <h4 className="text-xl font-serif mb-2">{item.title}</h4>
                      <p className="text-brand-paper/50 font-light text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white/5 aspect-square rounded-3xl p-8 flex flex-col justify-end border border-white/10">
                    <p className="text-4xl font-serif text-brand-gold mb-2">5k+</p>
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest opacity-60">MT Monthly</p>
                  </div>
                  <div className="bg-brand-gold aspect-[3/4] rounded-3xl p-8 flex flex-col justify-end">
                    <p className="text-4xl font-serif text-brand-ink mb-2">100%</p>
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-ink/60">Natural</p>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="bg-brand-paper aspect-[3/4] rounded-3xl p-8 flex flex-col justify-end">
                    <p className="text-4xl font-serif text-brand-ink mb-2">15+</p>
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest text-brand-ink/60">Nations</p>
                  </div>
                  <div className="bg-white/5 aspect-square rounded-3xl p-8 flex flex-col justify-end border border-white/10">
                    <p className="text-4xl font-serif text-brand-gold mb-2">ISO</p>
                    <p className="text-[9px] font-sans font-bold uppercase tracking-widest opacity-60">Certified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA - Minimalist */}
      <section className="py-32 bg-brand-paper">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-5xl md:text-6xl font-serif text-brand-ink mb-10 leading-tight">
              Begin Your <span className="italic">Partnership</span> With Us Today.
            </h2>
            <p className="text-brand-ink/60 text-lg font-light mb-12">
              Our export division is ready to assist you with customized quotes and logistics planning.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link to="/inquiry" className="btn-premium btn-gold px-12 py-5">
                Request a Quote
              </Link>
              <Link to="/contact" className="btn-premium btn-outline px-12 py-5">
                Contact Office
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
