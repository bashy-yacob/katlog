import { useDocumentTitle } from '@/hooks';
import './ContactPage.css';

export default function ContactPage() {
  useDocumentTitle('צור קשר - Royal Icing Catalog');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // יטופל בהמשך
  };

  return (
    <div className="contact-container">
      <div className="contact-header">
        <h1 className="contact-title">נשמח לשמוע ממך</h1>
        <p>לכל שאלה, בקשה להזמנה מיוחדת או ייעוץ מתוק</p>
      </div>

      <div className="contact-layout">
        {/* מידע ליצירת קשר */}
        <div className="contact-info-side">
          <h2>מידע ליצירת קשר</h2>
          <div className="info-item">
            <strong>טלפון</strong>
            <span>050-1234567</span>
          </div>
          <div className="info-item">
            <strong>אימייל</strong>
            <span>info@royalicing.com</span>
          </div>
          <div className="info-item">
            <strong>שעות פעילות</strong>
            <span>ראשון - חמישי: 09:00 - 18:00</span>
            <span>שישי: 09:00 - 13:00</span>
          </div>
        </div>

        {/* טופס יצירת קשר */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>השאר לנו הודעה</h2>
          
          <div className="form-group">
            <label htmlFor="name">שם מלא</label>
            <input type="text" id="name" name="name" placeholder="איך קוראים לך?" required />
          </div>

          <div className="form-group">
            <label htmlFor="email">אימייל</label>
            <input type="email" id="email" name="email" placeholder="כתובת המייל שלך" required />
          </div>

          <div className="form-group">
            <label htmlFor="phone">טלפון</label>
            <input type="tel" id="phone" name="phone" placeholder="מספר ליצירת קשר" required />
          </div>

          <div className="form-group">
            <label htmlFor="message">הודעה</label>
            <textarea id="message" name="message" rows={5} placeholder="ספר/י לנו על האירוע שלך..." required></textarea>
          </div>

          <button type="submit" className="submit-btn">שלח הודעה</button>
        </form>
      </div>
    </div>
  );
}