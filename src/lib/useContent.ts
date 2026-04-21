import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface SiteContent {
  homeHeroTitle: string;
  homeHeroSubtitle: string;
  homeHeroImage: string;
  homeAboutTitle: string;
  homeAboutText: string;
  homeAboutImage: string;
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutHeroText: string;
  aboutHeroImage: string;
  aboutImage: string;
  productsHeroTitle: string;
  productsHeroSubtitle: string;
  productsHeroText: string;
  productsHeroImage: string;
  exportHeroImage: string;
  exportTitle: string;
  exportSubtitle: string;
  exportText: string;
  exportRegions: string[];
  exportCerts: { title: string; subtitle: string }[];
  contactHeroImage: string;
  inquiryHeroImage: string;
  [key: string]: any; // Allow dynamic keys for arrays/objects
}

const defaultContent: SiteContent = {
  homeHeroTitle: "Premium Mustard Products",
  homeHeroSubtitle: "Manufacturer & Global Exporter",
  homeHeroImage: "https://res.cloudinary.com/dwgjahd8f/image/upload/v1775712040/Banner_One_bvaejn.png",
  homeAboutTitle: "Pioneering the Future of Agricultural Exports.",
  homeAboutText: "Based in the heart of Haryana, India, RCOM OILS AND SOLVEX PRIVATE LIMITED combines traditional wisdom with cutting-edge solvent extraction technology.",
  homeAboutImage: "https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&q=80&w=1000",
  aboutHeroTitle: "A Legacy of Quality & Innovation.",
  aboutHeroSubtitle: "Our Heritage",
  aboutHeroText: "Founded on the principles of integrity and excellence, RCOM OILS AND SOLVEX PRIVATE LIMITED has redefined mustard processing for the global market.",
  aboutHeroImage: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000",
  aboutImage: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000",
  productsHeroTitle: "Our Signature Mustard Portfolio.",
  productsHeroSubtitle: "The Collection",
  productsHeroText: "Discover our range of premium mustard products, processed with artisanal care and industrial precision.",
  productsHeroImage: "https://res.cloudinary.com/dwgjahd8f/image/upload/v1776324647/Mustard_Oil_Mustard_Cake_gntqv3.png",
  exportHeroImage: "https://images.unsplash.com/photo-1494412519320-aa613dfb7738?auto=format&fit=crop&q=80&w=2000",
  exportTitle: "Exporting Excellence Worldwide.",
  exportSubtitle: "Global Presence",
  exportText: "Connecting Indian agricultural heritage to the global animal feed industry with uncompromising standards.",
  exportRegions: ['South East Asia', 'Middle East', 'East Africa', 'Europe', 'Far East', 'SAARC Countries'],
  exportCerts: [
    { title: "ISO 9001:2015", subtitle: "Quality Management" },
    { title: "HACCP", subtitle: "Food Safety Standards" },
    { title: "GMP", subtitle: "Good Manufacturing Practices" },
    { title: "FSSAI", subtitle: "Food Safety License" }
  ],
  contactHeroImage: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=2000",
  inquiryHeroImage: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=2000",
};

export function useContent() {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'siteContent', 'main');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setContent({ ...defaultContent, ...docSnap.data() } as SiteContent);
      } else {
        // If it doesn't exist, we just use default content
        setContent(defaultContent);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching content:", error);
      // Fallback to default
      setContent(defaultContent);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const updateContent = async (newContent: Partial<SiteContent>) => {
    try {
      const docRef = doc(db, 'siteContent', 'main');
      await setDoc(docRef, { ...content, ...newContent }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'siteContent/main');
    }
  };

  return { content, loading, updateContent };
}
