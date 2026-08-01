const SUPPORT_URL = 'https://www.facebook.com/tainanoutlook';

export default function SupportFooter() {
  const {t}=useI18n();
  return (
    <footer className="support-footer">
      <div>
        <span className="support-heart" aria-hidden="true">♥</span>
        <p>
          <strong>{t('supportTitle')}</strong>
          {t('supportText')}
        </p>
      </div>
      <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
        {t('supportLink')}
        <span aria-hidden="true">↗</span>
      </a>
    </footer>
  );
}
import { useI18n } from './i18n';
