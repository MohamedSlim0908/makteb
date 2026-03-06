import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export function DeleteConfirmModal({ onConfirm, onClose, isPending, itemName = 'post' }) {
  return (
    <Modal isOpen onClose={onClose} title={`Delete ${itemName}`} size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Are you sure you want to delete this {itemName}?
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          This action cannot be undone.
        </p>
        <div className="flex justify-center gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isPending}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
}
