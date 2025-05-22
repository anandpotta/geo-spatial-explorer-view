
import React from 'react';
import ConfirmationDialog from './drawing/ConfirmationDialog';

interface ClearConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ClearConfirmationDialog: React.FC<ClearConfirmationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  return (
    <ConfirmationDialog
      isOpen={isOpen}
      title="Clear All Map Data"
      description="Are you sure you want to clear all drawings and markers from the map? This action cannot be undone."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default ClearConfirmationDialog;
