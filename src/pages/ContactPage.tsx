import type { FormEvent } from 'react';
import { useDocumentTitle } from '@/hooks';
import PageHeading from '@/components/PageHeading';
import Button from '@/components/Button';
import './ContactPage.css';

export default function ContactPage() {
  useDocumentTitle('צור קשר - Royal Icing Catalog');

  // The existing form has no send integration; preserve its submit behavior.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

  return (
    <div className="contact-page brand-wrap">
      <div className="contact-layout">
        <PageHeading eyebrow="יצירת קשר · עיצוב אישי" title="בואי נדבר על משהו מתוק."
          description="רעיון לעוגיות, אירוע שמתקרב או שאלה קטנה — זה המקום להתחיל." />
        <form className="contact-form brand-form" onSubmit={handleSubmit} aria-labelledby="contact-form-title">
          <div className="contact-form-heading"><h2 id="contact-form-title">מה את מדמיינת?</h2><p className="form-note">השדות המסומנים בכוכבית הם שדות חובה.</p></div>
          <div className="form-grid">
            <div className="form-group"><label htmlFor="name">שם מלא *</label><input type="text" id="name" name="name" autoComplete="name" placeholder="איך קוראים לך?" required /></div>
            <div className="form-group"><label htmlFor="phone">טלפון *</label><input type="tel" id="phone" name="phone" autoComplete="tel" dir="ltr" placeholder="מספר ליצירת קשר" required /></div>
            <div className="form-group form-group-wide"><label htmlFor="email">אימייל *</label><input type="email" id="email" name="email" autoComplete="email" dir="ltr" placeholder="כתובת המייל שלך" required /></div>
            <div className="form-group form-group-wide"><label htmlFor="message">הודעה *</label><textarea id="message" name="message" rows={5} placeholder="ספרי לנו על האירוע, הצבעים או הרעיון שלך..." required /></div>
          </div>
          <p className="ui-notice" id="contact-availability"><strong>שליחת הודעות דרך הטופס עדיין אינה זמינה.</strong><span>בינתיים אפשר להשתמש בפרטי הקשר המופיעים בעמוד.</span></p>
          <div className="contact-submit"><Button type="submit" className="submit-btn" aria-describedby="contact-availability">שלח הודעה</Button></div>
        </form>
        <aside className="contact-info">
          <h2>כל הפרטים הקטנים.</h2>
          <p className="contact-introduction">לכל שאלה, בקשה להזמנה מיוחדת או ייעוץ מתוק.</p>
          <dl>
            <div><dt>טלפון</dt><dd><a href="tel:0501234567" dir="ltr">050-1234567</a></dd></div>
            <div><dt>אימייל</dt><dd><a href="mailto:info@royalicing.com" dir="ltr">info@royalicing.com</a></dd></div>
            <div><dt>שעות פעילות</dt><dd>ראשון - חמישי: <bdi>09:00 - 18:00</bdi><br />שישי: <bdi>09:00 - 13:00</bdi></dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
