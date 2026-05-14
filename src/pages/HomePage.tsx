
import { useDocumentTitle } from '@/hooks';
import { Award, Palette, Heart } from 'lucide-react';
import './HomePage.css';
export default function HomePage() {
  useDocumentTitle('בית - Royal Icing Catalog');

  return (
    <div className="home-container">
      
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">אמנות מתוקה בכל זילוף</h1>
          <p className="hero-subtitle">עוגיות מעוצבות ייחודיות שהופכות כל אירוע לחגיגה ויזואלית</p>
          <a href="/catalog" className="cta-button">צפו בקטלוג המלא</a>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="icon-wrapper"><Palette /></div>
          <h3 className="feature-title">עוגיות ייחודיות</h3>
          <p className="feature-text">כל עוגייה מעוצבת בידיים עם רויאל אייסינג מקצועי, תוך שימת לב לפרטים.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper"><Heart /></div>
          <h3 className="feature-title">הזמנות מותאמות</h3>
          <p className="feature-text">אנחנו הופכים את החזון שלכם למציאות מתוקה, עם התאמה מלאה לאירוע.</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper"><Award /></div>
          <h3 className="feature-title">איכות עילית</h3>
          <p className="feature-text">טעם בלתי נשכח לצד המראה. חומרי הגלם הטובים ביותר בשוק.</p>
        </div>
      </section>

    </div>
  );
}