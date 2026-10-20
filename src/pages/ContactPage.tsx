import { useDocumentTitle } from '@/hooks';
import PageHeading from '@/components/PageHeading';
import ContactForm from '@/components/ContactForm';
import './ContactPage.css';

export default function ContactPage() {
  useDocumentTitle('צור קשר - Royal Icing Catalog');

  return (
    <div className="contact-page brand-wrap">
      <div className="contact-layout">
        <PageHeading eyebrow="יצירת קשר · עיצוב אישי" title="בואי נדבר על משהו מתוק."
          description="רעיון לעוגיות, אירוע שמתקרב או שאלה קטנה — זה המקום להתחיל." />
        <ContactForm />
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
