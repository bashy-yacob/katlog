import Modal from './Modal';

interface ImageLightboxProps { isOpen: boolean; imageSrc: string; imageAlt: string; onClose: () => void; }

export default function ImageLightbox({ isOpen, imageSrc, imageAlt, onClose }: ImageLightboxProps) {
  return <Modal isOpen={isOpen} title={imageAlt || 'מבט מקרוב'} onClose={onClose} className="lightbox-modal">
    <div className="modal-body"><img src={imageSrc} alt={imageAlt} className="lightbox-image" /></div>
  </Modal>;
}
