import { useTranslation } from 'react-i18next';

// Просте модальне вікно для форм створення/редагування.
export default function Modal({ title, onClose, onSave, children }) {
  const { t } = useTranslation();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
          <button className="btn btn-primary" onClick={onSave}>{t('common.save')}</button>
        </div>
      </div>
    </div>
  );
}
