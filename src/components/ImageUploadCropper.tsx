import { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Upload, X, Crop as CropIcon } from 'lucide-react';

interface ImageUploadCropperProps {
  onUpload: (url: string) => void;
  aspectRatio?: number; // e.g., 4/3 or 1
  label?: string;
}

export default function ImageUploadCropper({ onUpload, aspectRatio, label = "Upload Image" }: ImageUploadCropperProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop state
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = async (image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set canvas to precisely the crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleUpload = async () => {
    // If no crop is selected but an image is, we upload the full image
    // Otherwise we upload the cropped portion
    if (!imgRef.current) return;
    
    setIsUploading(true);
    try {
      let blob: Blob;
      
      if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
        blob = await getCroppedImg(imgRef.current, completedCrop);
      } else {
        // Fallback: full image if no crop was drawn
        blob = await fetch(src!).then(r => r.blob());
      }
      
      const filename = `uploads/img_${Date.now()}.jpg`;
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      onUpload(downloadURL);
      setSrc(null); // Close the cropper
      if(fileInputRef.current) fileInputRef.current.value = '';
    } catch (e) {
      console.error('Upload failed', e);
      alert('Upload failed. Please check Firebase storage rules and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!src) {
    return (
      <div className="flex items-center gap-4">
        <input 
          type="file" 
          accept="image/*" 
          onChange={onSelectFile}
          className="hidden"
          ref={fileInputRef}
        />
        <button 
          onClick={(e) => {
            e.preventDefault();
            fileInputRef.current?.click();
          }}
          className="flex items-center px-4 py-2 bg-brand-gold/10 text-brand-gold rounded-xl hover:bg-brand-gold/20 transition-colors text-sm font-bold shadow-sm"
        >
          <Upload className="w-4 h-4 mr-2" />
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif text-brand-ink flex items-center">
            <CropIcon className="w-6 h-6 mr-3 text-brand-gold" />
            Crop & Adjust Image
          </h3>
          <button onClick={() => {
            setSrc(null);
            if(fileInputRef.current) fileInputRef.current.value = '';
          }} className="p-2 bg-brand-paper hover:bg-brand-ink/5 rounded-full text-brand-ink/50 hover:text-brand-ink transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-brand-ink/60 mb-6 text-sm">
          Drag to select the focus area of your image. This will be the exact image uploaded and shown to your customers.
        </p>

        <div className="bg-brand-paper rounded-[30px] overflow-hidden mb-8 flex items-center justify-center min-h-[300px] max-h-[50vh] border border-brand-ink/5">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            className="max-h-full"
          >
            <img 
              ref={imgRef}
              src={src} 
              alt="Crop me" 
              className="max-h-[50vh] object-contain"
            />
          </ReactCrop>
        </div>
        
        <div className="flex justify-between items-center bg-brand-paper/50 p-4 rounded-3xl border border-brand-ink/5">
          <div className="text-xs text-brand-ink/60 font-bold uppercase tracking-widest pl-2">
            {aspectRatio ? `Fixed Aspect Ratio: ${aspectRatio === 1 ? '1:1 (Square)' : '4:3 (Card)'}` : 'Freeform Crop'}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setSrc(null);
                if(fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="px-6 py-2 rounded-xl text-brand-ink/70 font-bold hover:bg-white transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className={`flex items-center px-6 py-2 rounded-xl bg-brand-gold text-brand-ink font-bold transition-all shadow-md ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 hover:scale-105'}`}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Selection
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
