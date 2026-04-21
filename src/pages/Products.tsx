import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Package, Shield, Info, X, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { collection, onSnapshot, query, orderBy, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useContent } from '../lib/useContent';
import { useAuth } from '../lib/AuthContext';

interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  specs: { label: string; value: string; rcomStandard?: string }[];
  packaging: string;
  image: string;
  cardImage?: string;
  order?: number;
  hsCode?: string;
  exportMoq?: string;
}

const INITIAL_PRODUCTS = [
  {
    id: 'mustard-oil',
    title: 'Mustard Oil',
    subtitle: 'Pure & Solvent Extracted',
    description: 'Our mustard oil is known for its high pungency, rich aroma, and natural golden color. We use a combination of traditional cold-pressing and modern solvent extraction to ensure maximum yield and purity.',
    benefits: [
      'Rich in monounsaturated fatty acids',
      'High smoke point, ideal for cooking',
      'Natural antimicrobial properties',
      'Free from any artificial additives'
    ],
    specs: [
      { label: 'Purity', value: '100% Pure' },
      { label: 'Moisture', value: 'Max 0.25%' },
      { label: 'Free Fatty Acids', value: 'Max 1.5%' },
      { label: 'Color', value: 'Golden Yellow' }
    ],
    packaging: 'Available in 1L, 5L, 15L tins, and bulk tankers for industrial use.',
    image: 'https://res.cloudinary.com/dwgjahd8f/image/upload/v1776324647/Mustard_Oil_Mustard_Cake_gntqv3.png',
    order: 1
  },
  {
    id: 'mustard-oil-cake',
    title: 'Mustard Oil Cake',
    subtitle: 'High Energy Animal Feed',
    description: 'Mustard oil cake is the traditional byproduct of oil extraction. It is a rich source of protein and residual oil, making it an excellent energy supplement for cattle and livestock.',
    benefits: [
      'Increases milk yield in dairy cattle',
      'Improves fat content in milk',
      'Cost-effective protein source',
      'Palatable and easy to digest'
    ],
    specs: [
      { label: 'Protein', value: 'Min 35-37%' },
      { label: 'Oil Content', value: 'Min 7-8%' },
      { label: 'Moisture', value: 'Max 10%' },
      { label: 'Fiber', value: 'Max 10%' }
    ],
    packaging: '50kg PP Bags, Jute Bags, and Bulk Loose.',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
    order: 2
  },
  {
    id: 'mustard-doc',
    title: 'Mustard De-Oiled Cake (DOC)',
    subtitle: 'Solvent Extracted - Export Quality',
    description: 'Our specialization lies in manufacturing high-quality Mustard De-Oiled Cake through the solvent extraction process. This product has extremely low oil content and very high protein concentration, making it ideal for poultry, cattle, and aquaculture feed.',
    benefits: [
      'Highest protein concentration (38%+)',
      'Extremely low residual oil (<1%)',
      'Longer shelf life due to low moisture',
      'Uniform quality for balanced feed formulations'
    ],
    specs: [
      { label: 'Moisture', value: 'Max 10%', rcomStandard: '9.82%' },
      { label: 'Crude Protein', value: '35% - 38%', rcomStandard: '37.10%' },
      { label: 'Crude Fibre', value: 'Max 10%', rcomStandard: '8.67%' },
      { label: 'Total Ash', value: 'Max 7%', rcomStandard: '5.97%' },
      { label: 'Acid Insoluble Ash', value: 'Max 2%', rcomStandard: '0.89%' }
    ],
    packaging: '50kg New PP Bags, Bulk in Containers, and Jumbo Bags.',
    image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?auto=format&fit=crop&q=80&w=1200',
    order: 3
  }
];

export default function Products() {
  const { content } = useContent();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ADMIN_EMAILS = ['rcomoilsandsolvex@gmail.com', 'anujkumarmittal@gmail.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (expandedId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [expandedId]);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('order', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      if (productsData.length === 0) {
        // Fallback to initial data if empty
        setProducts(INITIAL_PRODUCTS);
        if (loading) {
          seedInitialData();
        }
      } else {
        // Merge in the new specs from INITIAL_PRODUCTS if they are missing
        const mergedProducts = productsData.map(p => {
          if (p.id === 'mustard-doc' && !p.specs.some(s => s.rcomStandard)) {
            const initialDoc = INITIAL_PRODUCTS.find(ip => ip.id === 'mustard-doc');
            if (initialDoc) {
              return { ...p, specs: initialDoc.specs };
            }
          }
          return p;
        });
        
        setProducts(mergedProducts);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin]); // Re-run if admin status changes to potentially seed

  const seedInitialData = async () => {
    if (!isAdmin) return; // Only admins can seed data
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      if (snapshot.empty) {
        for (const product of INITIAL_PRODUCTS) {
          const { id, ...rest } = product;
          await setDoc(doc(db, 'products', id), rest);
        }
      }
    } catch (error) {
      console.error("Error seeding data:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-paper">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const expandedProduct = products.find(p => p.id === expandedId);

  return (
    <div>
      <Helmet>
        <title>{expandedProduct ? `${expandedProduct.title} | RCOM OILS` : 'Our Products | RCOM OILS'}</title>
        <meta name="description" content={expandedProduct ? expandedProduct.description : (content.productsHeroText || 'Discover our range of premium mustard products, processed with artisanal care and industrial precision.')} />
        
        {/* Schema.org Structured Data */}
        {expandedProduct ? (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": expandedProduct.title,
              "image": expandedProduct.image,
              "description": expandedProduct.description,
              "brand": {
                "@type": "Brand",
                "name": "RCOM OILS"
              }
            })}
          </script>
        ) : (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "ItemList",
              "itemListElement": products.map((p, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "Product",
                  "name": p.title,
                  "image": p.image,
                  "description": p.description
                }
              }))
            })}
          </script>
        )}
      </Helmet>

      {/* Page Header - Home Style */}
      <section className="relative w-full overflow-hidden">
        {/* Background Image */}
        <div className="relative w-full">
          <img
            src={content.productsHeroImage || "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=2000"}
            alt="Products"
            className="w-full aspect-[16/9] md:aspect-[21/9] lg:h-[400px] object-cover block"
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
                {content.productsHeroTitle.split(' ').map((word, i, arr) => 
                  i === arr.length - 1 ? <span key={i} className="text-[#facc15]">{word}</span> : <span key={i}>{word} </span>
                )}
              </h1>
              <h2 className="text-2xl lg:text-4xl font-sans font-bold text-white mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight text-left">
                {content.productsHeroSubtitle}
              </h2>
              
              <p className="text-base lg:text-xl font-sans font-bold text-white mb-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-left">
                {content.productsHeroText}
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

      {/* Product Showcase - Interactive Grid */}
      <section className="section-padding bg-brand-paper">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <motion.div
                layoutId={`card-${product.id}`}
                key={product.id}
                onClick={() => setExpandedId(product.id)}
                className="bg-white rounded-[40px] rounded-br-none shadow-xl cursor-pointer overflow-hidden border border-brand-ink/5 group flex flex-col"
              >
                <motion.div layoutId={`image-${product.id}`} className="aspect-[4/3] overflow-hidden relative shrink-0">
                  {product.cardImage || product.image ? (
                    <>
                      {/* Blurred Background to fill the box */}
                      <img 
                        src={product.cardImage || product.image} 
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-110"
                        aria-hidden="true"
                        referrerPolicy="no-referrer"
                      />
                      {/* Clean Product Image */}
                      <img 
                        src={product.cardImage || product.image} 
                        alt={product.title} 
                        className="relative z-10 w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer" 
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-ink/10">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-brand-gold text-white px-4 py-2 rounded-xl font-sans text-[9px] font-bold uppercase tracking-widest shadow-md">
                    {product.subtitle}
                  </div>
                </motion.div>
                <motion.div layoutId={`content-${product.id}`} className="p-8 flex flex-col flex-grow">
                  <motion.h2 layoutId={`title-${product.id}`} className="text-2xl font-serif text-brand-ink mb-4">{product.title}</motion.h2>
                  <p className="text-brand-ink/60 font-light text-sm line-clamp-3 mb-8 flex-grow">{product.description}</p>
                  <div className="flex items-center text-brand-gold text-xs font-bold uppercase tracking-widest mt-auto">
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expanded Modal */}
      <AnimatePresence>
        {expandedId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpandedId(null)}
              className="fixed inset-0 bg-brand-ink/80 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 pointer-events-none">
              {products.filter(p => p.id === expandedId).map(product => (
                <motion.div
                  layoutId={`card-${product.id}`}
                  key={product.id}
                  className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto pointer-events-auto flex flex-col lg:flex-row"
                >
                  <motion.div layoutId={`image-${product.id}`} className="lg:w-2/5 relative shrink-0 bg-brand-paper overflow-hidden">
                    {product.image ? (
                      <>
                        {/* Blurred Background to fill the box */}
                        <img 
                          src={product.image} 
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-125"
                          aria-hidden="true"
                          referrerPolicy="no-referrer"
                        />
                        {/* Clean Product Image */}
                        <img 
                          src={product.image} 
                          alt={product.title} 
                          className="relative z-10 w-full h-64 lg:h-full object-contain"
                          referrerPolicy="no-referrer" 
                        />
                      </>
                    ) : (
                      <div className="w-full h-64 lg:h-full flex items-center justify-center text-brand-ink/10">
                        <ImageIcon className="w-24 h-24" />
                      </div>
                    )}
                    <button 
                      onClick={() => setExpandedId(null)}
                      className="absolute top-6 right-6 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2 rounded-full text-white transition-colors lg:hidden"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </motion.div>
                  
                  <motion.div layoutId={`content-${product.id}`} className="p-8 md:p-12 lg:w-3/5 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <p className="text-brand-gold font-sans text-[10px] font-bold uppercase tracking-widest mb-2">{product.subtitle}</p>
                        <motion.h2 layoutId={`title-${product.id}`} className="text-3xl md:text-4xl font-serif text-brand-ink">{product.title}</motion.h2>
                      </div>
                      <button 
                        onClick={() => setExpandedId(null)}
                        className="hidden lg:block text-brand-ink/40 hover:text-brand-ink transition-colors"
                      >
                        <X className="w-8 h-8" />
                      </button>
                    </div>
                    
                    <p className="text-brand-ink/70 font-light leading-relaxed mb-8">
                      {product.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                      <div>
                        <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-4 flex items-center">
                          <Check className="w-4 h-4 mr-2" /> Key Benefits
                        </h3>
                        <ul className="space-y-3">
                          {product.benefits.map((benefit, bIdx) => (
                            <li key={bIdx} className="flex items-start text-sm text-brand-ink/70 font-light">
                              <span className="w-1 h-1 bg-brand-gold rounded-full mt-2 mr-3 shrink-0"></span>
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-brand-gold uppercase tracking-widest mb-4 flex items-center">
                          <Info className="w-4 h-4 mr-2" /> Specifications
                        </h3>
                        <div className="space-y-2">
                          {product.specs.some(s => s.rcomStandard) && (
                            <div className="flex justify-between border-b border-brand-ink/10 pb-2 text-[10px] font-bold text-brand-ink/40 uppercase tracking-widest">
                              <span className="flex-1">Parameter</span>
                              <span className="flex-1 text-center">Specification</span>
                              <span className="flex-1 text-right text-brand-gold">RCOM Standard</span>
                            </div>
                          )}
                          {product.specs.map((spec, sIdx) => (
                            <div key={sIdx} className="flex justify-between border-b border-brand-ink/5 pb-2 text-sm">
                              {spec.rcomStandard ? (
                                <>
                                  <span className="text-brand-ink/40 font-light flex-1">{spec.label}</span>
                                  <span className="text-brand-ink/70 font-light flex-1 text-center">{spec.value}</span>
                                  <span className="font-bold text-brand-ink flex-1 text-right">{spec.rcomStandard}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-brand-ink/40 font-light">{spec.label}</span>
                                  <span className="font-bold text-brand-ink">{spec.value}</span>
                                </>
                              )}
                            </div>
                          ))}
                          {product.hsCode && (
                            <div className="flex justify-between border-b border-brand-ink/5 pb-2 text-sm">
                              <span className="text-brand-gold font-bold">HS Code (Export)</span>
                              <span className="font-bold text-brand-ink">{product.hsCode}</span>
                            </div>
                          )}
                          {product.exportMoq && (
                            <div className="flex justify-between border-b border-brand-ink/5 pb-2 text-sm">
                              <span className="text-brand-gold font-bold">Minimum Order (Export)</span>
                              <span className="font-bold text-brand-ink">{product.exportMoq}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-brand-paper p-6 rounded-2xl border border-brand-ink/5 mb-8 flex items-start mt-auto">
                      <Package className="w-5 h-5 text-brand-gold mr-4 shrink-0 mt-1" />
                      <div>
                        <h3 className="text-[10px] font-bold text-brand-ink uppercase tracking-widest mb-1">Packaging Details</h3>
                        <p className="text-brand-ink/60 text-sm font-light">{product.packaging}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-brand-ink/5">
                      <div className="flex items-center text-brand-ink/40 font-sans text-[10px] font-bold uppercase tracking-widest">
                        <Shield className="w-4 h-4 mr-2" /> Quality Guaranteed
                      </div>
                      <Link
                        to="/inquiry"
                        className="btn-premium btn-gold"
                      >
                        Inquire Now
                      </Link>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Customization Banner - Minimal */}
      <section className="py-32 bg-brand-ink text-white">
        <div className="container-custom text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-serif mb-8">Custom <span className="italic text-brand-gold">Specifications</span> Available.</h2>
          <p className="text-brand-paper/50 font-light text-lg leading-relaxed mb-12">
            We understand that different markets have different requirements. We can customize the protein and oil content of our products to meet your specific feed formulations.
          </p>
          <Link to="/contact" className="btn-premium btn-outline text-white border-white/20 hover:bg-white hover:text-brand-ink">
            Discuss Custom Order
          </Link>
        </div>
      </section>
    </div>
  );
}
