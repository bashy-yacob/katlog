import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';
import PageState from '@/components/PageState';
import Button from '@/components/Button';
import NotFoundPage from './NotFoundPage';
import { useDocumentTitle } from '@/hooks';

export default function RouteErrorPage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;
  useDocumentTitle(isNotFound ? 'העמוד לא נמצא - Royal Icing' : 'אירעה שגיאה - Royal Icing');
  return (
    <div className="brand-surface brand-layout">
      <BrandHeader />
      <main id="main" className="brand-main" tabIndex={-1}>
        {isNotFound ? <NotFoundPage /> : <div className="system-page brand-wrap"><PageState headingLevel={1} title="משהו השתבש בדרך."
          description="לא הצלחנו להציג את העמוד כרגע. אפשר לנסות לטעון אותו מחדש או לחזור לדף הבית."
          action={<><Button onClick={() => window.location.reload()}>לנסות שוב</Button><Link className="brand-button secondary" to="/">לדף הבית</Link></>} /></div>}
      </main>
      <BrandFooter />
    </div>
  );
}
