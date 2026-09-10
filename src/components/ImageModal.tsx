"use client";

import { useEffect, useCallback } from 'react';
import { X, Download, ExternalLink } from 'lucide-react';

interface ImageModalProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export default function ImageModal({ src, alt = 'Visualização', onClose }: ImageModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (src) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [src, handleKeyDown]);

  if (!src) return null;

  const isPdf = src.includes('.pdf') || src.includes('application/pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="relative w-full h-full flex items-center justify-center">
        {isPdf ? (
          <iframe
            src={src}
            className="w-full h-full max-w-5xl max-h-[90vh] rounded-2xl bg-white"
            title={alt}
          />
        ) : (
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        )}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors"
        >
          <ExternalLink className="w-4 h-4" /> Abrir em nova aba
        </a>
        <a
          href={src}
          download
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Baixar
        </a>
      </div>
    </div>
  );
}
