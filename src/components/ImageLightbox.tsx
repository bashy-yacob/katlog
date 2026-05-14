import React from 'react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageSrc: string;
  imageAlt: string;
  onClose: () => void;
}

export default function ImageLightbox({
  isOpen,
  imageSrc,
  imageAlt,
  onClose,
}: ImageLightboxProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="lightbox-overlay"
      onClick={onClose}
    >
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="lightbox-close" onClick={onClose}>
          ✕
        </button>
        <img 
          src={imageSrc} 
          alt={imageAlt} 
          className="lightbox-image"
        />
      </div>
    </div>
  );
}
