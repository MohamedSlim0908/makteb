import { useEffect, useMemo, useRef, useState } from 'react';
import { BioTextarea } from './BioTextarea';
import { CompletionButton } from './CompletionButton';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function CompleteProfileModal({ isOpen, allowSkip = false, onClose, onComplete }) {
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape' && allowSkip) {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = modalRef.current;
      if (!container) return;

      const focusable = [...container.querySelectorAll(FOCUSABLE_SELECTOR)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    const focusable = modalRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    (focusable?.[0] || modalRef.current)?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [allowSkip, isOpen, onClose]);

  const isValid = useMemo(() => Boolean(avatarFile) || bio.trim().length > 0, [avatarFile, bio]);

  if (!isOpen) return null;

  function handleAvatarSelect(file) {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        onComplete?.({
          avatarFile,
          bio: bio.trim(),
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-6 animate-fade-in"
      onClick={(event) => {
        if (allowSkip && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Complete your profile"
        tabIndex={-1}
        className="w-full max-w-[460px] rounded-2xl border border-gray-200 bg-white px-6 py-7 shadow-modal outline-none sm:px-8"
      >
        <form onSubmit={handleSubmit}>
          <h2 className="text-center text-[2rem] font-bold text-gray-900">Complete your profile</h2>
          <p className="mt-3 text-center text-base leading-relaxed text-gray-600">
            Communities feel better with real faces and names. Profiles help build trust and make
            it easier to connect with others.
          </p>

          <div className="mt-5">
            <ProfileAvatarUpload previewUrl={avatarPreview} onFileSelect={handleAvatarSelect} />
          </div>

          <BioTextarea value={bio} onChange={setBio} maxLength={150} />

          <CompletionButton disabled={!isValid} isSubmitting={isSubmitting}>
            COMPLETE
          </CompletionButton>
        </form>
      </div>
    </div>
  );
}
