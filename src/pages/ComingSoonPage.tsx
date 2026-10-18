import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks';
import PageHeading from '@/components/PageHeading';
import './ComingSoonPage.css';

type ComingSoonPageProps = { kind: 'courses' | 'videos' };

export default function ComingSoonPage({ kind }: ComingSoonPageProps) {
  const isCourses = kind === 'courses';
  const title = isCourses ? 'קורסים' : 'סרטונים';
  useDocumentTitle(title + ' - Royal Icing Catalog');
  return (
    <div className="coming-soon-page brand-wrap">
      <div className="coming-soon-intro">
        <PageHeading eyebrow={isCourses ? 'ללמוד ליצור · קורסים מוקלטים' : 'תוכן חינמי · השראה ויצירה'} title={title}
          description={isCourses ? 'עולם של יצירה, בזמן שלך ובקצב שלך.' : 'טיפים קטנים, תהליך מדויק והרבה השראה.'} />
        <div className="ui-actions">
          <Link className="brand-button primary" to="/catalog">לגלריית העוגיות</Link>
          <Link className="brand-text-link" to="/">חזרה לדף הבית</Link>
        </div>
      </div>
      <section className="coming-soon-message" aria-labelledby="coming-soon-message-title">
        <p className="ui-eyebrow">בקרוב</p>
        <h2 id="coming-soon-message-title">{isCourses ? 'ליצור משהו משלך.' : 'קצת ידע. הרבה השראה.'}</h2>
        <p>{isCourses
          ? 'עמוד הקורסים נמצא בהכנה. בהמשך יופיעו כאן קורסים ללימוד עיצוב עוגיות ברויאל אייסינג. כרגע אין קורסים זמינים או אפשרות הרשמה.'
          : 'עמוד הסרטונים נמצא בהכנה. בהמשך יופיעו כאן סרטוני הדרכה, טיפים והשראה לעיצוב עוגיות ברויאל אייסינג. כרגע אין סרטונים לצפייה.'}</p>
      </section>
    </div>
  );
}
