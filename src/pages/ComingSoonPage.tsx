import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks';
import './ComingSoonPage.css';

type ComingSoonPageProps = { kind: 'courses' | 'videos' };

export default function ComingSoonPage({ kind }: ComingSoonPageProps) {
  const isCourses = kind === 'courses';
  const title = isCourses ? 'קורסים' : 'סרטונים';
  useDocumentTitle(title + ' - Royal Icing Catalog');

  return (
    <div className={'coming-soon-page brand-wrap launch-' + kind}>
      <div className="launch-topline">
        <p className="ui-eyebrow">{isCourses ? 'ללמוד ליצור · קורסים מוקלטים' : 'תוכן חינמי · השראה ויצירה'}</p>
        <p className="launch-status">בקרוב</p>
      </div>
      <div className="launch-heading">
        <h1>{title}</h1>
        <h2 className="launch-statement" id="launch-statement">
          {isCourses ? <>ליצור משהו <em>משלך.</em></> : <>קצת ידע. <em>הרבה השראה.</em></>}
        </h2>
      </div>
      <section className="launch-detail" aria-labelledby="launch-statement">
        <div className="launch-detail-copy">
          <p className="launch-lead">{isCourses ? 'עולם של יצירה, בזמן שלך ובקצב שלך.' : 'טיפים קטנים, תהליך מדויק והרבה השראה.'}</p>
          <p>{isCourses
            ? 'עמוד הקורסים נמצא בהכנה. בהמשך יופיעו כאן קורסים ללימוד עיצוב עוגיות ברויאל אייסינג. כרגע אין קורסים זמינים או אפשרות הרשמה.'
            : 'עמוד הסרטונים נמצא בהכנה. בהמשך יופיעו כאן סרטוני הדרכה, טיפים והשראה לעיצוב עוגיות ברויאל אייסינג. כרגע אין סרטונים לצפייה.'}</p>
        </div>
        <div className="ui-actions">
          <Link className="brand-button primary" to="/catalog">לגלריית העוגיות</Link>
          <Link className="brand-text-link" to="/">חזרה לדף הבית</Link>
        </div>
      </section>
    </div>
  );
}
