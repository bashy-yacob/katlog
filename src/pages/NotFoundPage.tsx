import { Link } from 'react-router-dom';
import PageState from '@/components/PageState';
import { useDocumentTitle } from '@/hooks';

export default function NotFoundPage() {
  useDocumentTitle('העמוד לא נמצא - Royal Icing');
  return <div className="system-page brand-wrap"><PageState headingLevel={1}
    title="העמוד הזה לא נמצא." description="ייתכן שהקישור השתנה או שהכתובת אינה נכונה. אפשר להמשיך לגלריית העוגיות או לחזור לדף הבית."
    action={<><Link className="brand-button primary" to="/catalog">לגלריית העוגיות</Link><Link className="brand-button secondary" to="/">לדף הבית</Link></>} /></div>;
}
