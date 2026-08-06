import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Maximize2, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Attachment } from '../types';

interface ImageAttachmentProps {
  attachment: Attachment;
  sessionId?: string;
  isAdmin?: boolean;
}

/**
 * Checks if the MIME type belongs to a supported image.
 */
export const isImageAttachment = (type: string | undefined): boolean => {
  if (!type) return false;
  const t = type.toLowerCase();
  return (
    t.includes('image/png') ||
    t.includes('image/jpeg') ||
    t.includes('image/jpg') ||
    t.includes('image/webp') ||
    t.includes('image/gif') ||
    t.includes('png') ||
    t.includes('jpg') ||
    t.includes('jpeg') ||
    t.includes('webp') ||
    t.includes('gif')
  );
};

/**
 * Helper to safely extract hash from attachment data URL.
 */
export const getAttachmentHash = (dataUrl: string | undefined): string | null => {
  if (dataUrl && dataUrl.startsWith('/api/attachments/')) {
    const parts = dataUrl.split('/');
    return parts[3] || null;
  }
  return null;
};

// Helper to parse cookies on the client side
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const ImageAttachment: React.FC<ImageAttachmentProps> = ({
  attachment,
  sessionId,
  isAdmin = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [fallbackStage, setFallbackStage] = useState(0); // 0 = thumbnail, 1 = full webp, 2 = original / raw data, 3 = failed

  // Close lightbox on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const hash = getAttachmentHash(attachment.data);
  const isBase64 = attachment.data?.startsWith('data:');

  // Build secure URLs using query parameter authentication to bypass iframe cookie limits
  const getSecureQueryParams = () => {
    const adminToken = getCookie('admin_session_token') || '';
    const chatSessionIdCookie = getCookie('chat_session_id') || '';
    const parts: string[] = [];
    
    if (sessionId) {
      parts.push(`chatId=${encodeURIComponent(sessionId)}`);
    } else if (chatSessionIdCookie) {
      parts.push(`chatId=${encodeURIComponent(chatSessionIdCookie)}`);
    }
    
    if (adminToken) {
      parts.push(`adminToken=${encodeURIComponent(adminToken)}`);
    }
    
    return parts.length > 0 ? `?${parts.join('&')}` : '';
  };

  const queryParam = getSecureQueryParams();

  const fullSrc = hash
    ? `/api/attachments/${hash}/${encodeURIComponent(attachment.name)}${queryParam}`
    : attachment.data;

  const thumbSrc = hash
    ? `/api/attachments/${hash}/thumbnail${queryParam}`
    : attachment.data;

  // Determine actual image source based on fallback stage
  let currentSrc = thumbSrc;
  if (fallbackStage === 1) {
    currentSrc = fullSrc;
  } else if (fallbackStage === 2) {
    currentSrc = attachment.data || '';
  }

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    // If thumbnail fails, try full image
    if (fallbackStage === 0) {
      setFallbackStage(1);
      setIsLoading(true);
    } 
    // If full image fails, try original raw URL
    else if (fallbackStage === 1) {
      setFallbackStage(2);
      setIsLoading(true);
    } 
    // If all fail, mark as error
    else {
      setFallbackStage(3);
      setIsLoading(false);
      setHasError(true);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering lightbox close/open
    const link = document.createElement('a');
    link.href = fullSrc;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fileExt = attachment.name.split('.').pop()?.toUpperCase() || 'IMG';

  return (
    <div className="mt-2.5 w-full max-w-[260px] sm:max-w-[280px]">
      {/* Thumbnail Card */}
      <div 
        id={`thumb-card-${hash || 'raw'}`}
        onClick={() => !hasError && setIsOpen(true)}
        className={`group relative overflow-hidden rounded-2xl border bg-white/80 transition-all duration-200 shadow-sm ${
          hasError ? 'cursor-default border-slate-200' : 'cursor-zoom-in border-slate-200/80 hover:border-slate-300 hover:shadow-md'
        }`}
      >
        {/* Aspect Ratio Box */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50/50">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50 animate-pulse">
              <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
            </div>
          )}

          {hasError || fallbackStage === 3 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-slate-400 bg-slate-50/80">
              <ImageIcon className="w-6 h-6 text-slate-300 mb-1" />
              <span className="text-[10px] font-semibold text-slate-400">Failed to load preview</span>
            </div>
          ) : (
            <img
              src={currentSrc}
              alt={attachment.name}
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-104 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              referrerPolicy="no-referrer"
            />
          )}

          {/* Hover Overlay */}
          {!hasError && !isLoading && fallbackStage !== 3 && (
            <div className="absolute inset-0 bg-black/3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-xs p-2 rounded-full shadow-md translate-y-2 group-hover:translate-y-0 transition-all duration-250 ease-out">
                <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
              </div>
            </div>
          )}
        </div>

        {/* Attachment Meta Footer */}
        <div className="flex items-center justify-between gap-2.5 border-t border-slate-100/80 px-3 py-2 bg-white/95">
          <div className="min-w-0 text-left">
            <div className="text-[11px] font-bold text-slate-800 truncate" title={attachment.name}>
              {attachment.name}
            </div>
            <div className="text-[9px] font-extrabold text-slate-400 tracking-wider mt-0.5">
              {fileExt} • IMAGE
            </div>
          </div>
          <button
            type="button"
            id={`dl-btn-${hash || 'raw'}`}
            onClick={handleDownload}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
            title="Download full image"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`lightbox-overlay-${hash || 'raw'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4 sm:p-6"
          >
            {/* Top Bar controls */}
            <div 
              className="absolute top-0 inset-x-0 h-16 flex items-center justify-between px-4 sm:px-6 bg-gradient-to-b from-black/60 to-transparent text-white select-none pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="min-w-0 max-w-[70%] text-left">
                <h3 className="text-sm sm:text-base font-semibold truncate text-white">{attachment.name}</h3>
                <p className="text-[10px] sm:text-xs text-slate-300 mt-0.5">
                  {fileExt} Image
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-all duration-150"
                  title="Download Image"
                >
                  <Download className="w-4 h-4 sm:w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 bg-white/10 hover:bg-white/20 text-white transition-all duration-150"
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image Container with Animation */}
            <div className="relative w-full max-w-5xl max-h-[80vh] flex items-center justify-center">
              <motion.img
                key={fullSrc}
                src={fullSrc}
                alt={attachment.name}
                initial={{ scale: 0.95, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 10 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
