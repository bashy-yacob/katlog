import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import BrandHeader from '@/components/BrandHeader';
import BrandFooter from '@/components/BrandFooter';
import { useDocumentTitle } from '@/hooks';
import './HomePage.css';

export default function HomePage() {
  useDocumentTitle('עוגיות רויאל אייסינג בעבודת יד | קורסים והזמנות');
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    page.querySelectorAll('.rv').forEach(element => observer.observe(element));
    page.classList.add('reveal-ready');
    return () => {
      observer.disconnect();
      page.classList.remove('reveal-ready');
    };
  }, []);

  return (
    <div className="home-page brand-surface" ref={pageRef} dir="rtl">
      <BrandHeader />

      <main id="main" tabIndex={-1}>
      <div className="wrap"><section className="hero">
        <div className="copy">
          <div className="eyebrow">עוגיות מעוצבות · יצירה · קורסים</div>
          <h1>קצת מתוק.<em>הרבה יצירה.</em></h1>
          <p className="lead">עוגיות רויאל אייסינג בעבודת יד, שנוצרות אחת־אחת, עם תשומת לב לפרטים הקטנים.<br />ולמי שלא רוצה רק להזמין — יש גם דרך ללמוד איך ליצור אותן בעצמך.</p>
          <div className="actions"><Link className="btn primary" to="/catalog">לבחירת סטים</Link><Link className="btn secondary" to="/courses">ללימוד הקורסים</Link></div>
        </div>
        <div className="visual">
          <div className="blob" aria-hidden="true"></div>
          <div className="shot photo"><img className="ph" src="/images/home/hero.webp" alt="עוגיות רויאל אייסינג עגולות בעיצובי פרחים עדינים בגווני ורוד וקרם" decoding="async" /></div>
          <div className="badge">Made with care<small>עיצוב מוקפד, עד הפרטים הקטנים</small></div>
        </div>
      </section></div>

      <section className="values"><div className="wrap rv">
        <h2 className="vh">מה אפשר לעשות כאן</h2>
        <ul>
        <li data-n="01"><h3><Link to="/catalog">סטים מוכנים</Link></h3><p>עיצובים מוכנים בסטים של 10 עוגיות ומעלה, בכמות ובתאריך שמתאימים לך.</p></li>
        <li data-n="02"><h3><a href="#custom">עיצוב אישי</a></h3><p>רעיון משלך? מגישים בקשה ומקבלים הצעת מחיר.</p></li>
        <li data-n="03"><h3><Link to="/courses">ללמוד ליצור</Link></h3><p>קורסים מוקלטים שאפשר ללמוד מהם בקצב שלך.</p></li>
      </ul></div></section>

      <section id="cookies"><div className="wrap">
        <div className="sec-head rv"><div><div className="eyebrow">קטלוג</div><h2>עוגיות <em>שכיף לתת. קשה להפסיק להסתכל עליהן.</em></h2><p>סטים מוכנים בעיצובים מוקפדים, לאירועים, למתנות או פשוט כי מתחשק משהו קצת אחר.</p></div></div>
        <div className="grid3">
          <article className="card rv"><div className="shot"><img className="ph" src="/images/home/floral-set.webp" alt="סט עוגיות בצורת פרחים בגווני ורוד ולבן" loading="lazy" decoding="async" /></div><h3><Link to="/catalog">סט פרחוני</Link></h3><p>עדין, רך ומדויק — גוונים של ורוד וקרם עם פרטים שעושים את כל ההבדל.</p><div className="price"><b>120 ₪</b><span>ל-10 עוגיות</span></div><Link className="go" to="/catalog">לפרטים ולהזמנה</Link></article>
          <article className="card rv"><div className="shot"><img className="ph" src="/images/home/gift-set.webp" alt="עוגיות עם סרטים ופרחים בקצוות מסולסלים בגווני קרם וורוד" loading="lazy" decoding="async" /></div><h3><Link to="/catalog">סט מתנה</Link></h3><p>מארז קטן ומוקפד, שנראה טוב עוד לפני שפותחים אותו — וכמובן, אפילו יותר טוב אחר כך.</p><div className="price"><b>120 ₪</b><span>ל-10 עוגיות</span></div><Link className="go" to="/catalog">לפרטים ולהזמנה</Link></article>
          <article className="card rv"><div className="shot"><img className="ph" src="/images/home/event-set.webp" alt="סט עוגיות עגולות בעיצוב אחיד של ענפים ופרחים" loading="lazy" decoding="async" /></div><h3><Link to="/catalog">סט לאירוע</Link></h3><p>עיצוב אחיד שמחבר את כל השולחן ונותן לאירוע את הפרטים הקטנים שזוכרים.</p><div className="price"><b>120 ₪</b><span>ל-10 עוגיות</span></div><Link className="go" to="/catalog">לפרטים ולהזמנה</Link></article>
        </div>
        <p className="catalog-link"><Link className="go" to="/catalog">לכל הסטים בקטלוג</Link></p>
        <div className="terms rv" id="terms"><span className="tl">טוב לדעת</span><ul><li>מינימום להזמנה: 10 עוגיות</li><li>כל עוגייה נוספת: 10 ₪</li><li>בוחרים סט, מגדירים כמות ותאריך — ומשם ממשיכים להזמנה</li></ul></div>
        <p className="demo">* המחירים והכמויות באתר הם נתוני הדגמה.</p>
      </div></section>

      <section className="custom" id="custom"><div className="wrap split">
        <div className="rv">
          <div className="eyebrow">עיצוב אישי</div>
          <h2>יש רעיון בראש? <em>בואי נהפוך אותו לעוגייה.</em></h2>
          <p className="cp">לפעמים הסט המוכן הוא בדיוק מה שחיפשת. ולפעמים יש לך צבעים, רעיון, אירוע או תמונה בראש — ואת רוצה משהו שהוא רק שלך.</p>
          <p className="cp">ספרי לי מה את מדמיינת, מתי צריך וכמה עוגיות — אני אבדוק את הבקשה ואחזור אלייך עם הצעת מחיר מסודרת.</p>
          <h3 className="sh">איך זה עובד?</h3>
          <ol className="steps"><li><div><b>מספרת לי מה את רוצה</b><span>רעיון, סגנון, צבעים, השראה וכל מה שכבר יש לך בראש.</span></div></li><li><div><b>אני בודקת את הבקשה</b><span>התאמה לעיצוב, לכמות ולתאריך הרצוי.</span></div></li><li><div><b>מקבלת הצעת מחיר</b><span>ברורה ומסודרת, לפני שמתחילים.</span></div></li><li><div><b>מאשרים וממשיכים להזמנה</b><span>מאשרת את ההצעה, ומשלימים את פרטי ההזמנה.</span></div></li></ol>
          <p className="formnote"><b>בטופס:</b> מטרת האירוע · סגנון · צבעים · תמונת השראה · כמות · תאריך · פרטי קשר</p>
          <Link className="btn primary" to="/contact">לבקשת עיצוב אישי</Link>
        </div>
        <div className="shot rv"><img className="ph" src="/images/home/custom-cookies.webp" alt="עוגיות בעיצוב אישי: זר פרחים, לב ועיגול מעוטר" loading="lazy" decoding="async" /></div>
      </div></section>

      <section className="courses" id="courses"><div className="wrap">
        <div className="sec-head rv"><div><div className="eyebrow">קורסים מוקלטים</div><h2>לא רק להסתכל על העוגיות. <em>ללמוד איך ליצור אותן.</em></h2><p>אם תמיד הסתכלת על עוגיות מעוצבות וחשבת "איך עושים את זה?" — כאן מתחילים לפרק את התהליך לגובה העיניים.</p><p>קורסים מוקלטים, מסודרים שלב־שלב, שאפשר ללמוד מהם בזמן שלך ולחזור אליהם שוב ושוב.</p></div></div>
        <div className="grid2">
          <article className="card course rv"><div className="shot wide"><img className="ph" src="/images/home/basics-course.webp" alt="" loading="lazy" decoding="async" /><div className="play" aria-hidden="true"><i></i></div></div><div className="meta"><span>12 שיעורים</span><span>מתחילות</span></div><h3><Link to="/courses">יסודות הרויאל אייסינג</Link></h3><p>מהבצק והאייסינג ועד לעיצוב העוגייה הראשונה.</p><p className="for">לא צריך ניסיון קודם — רק רצון להתחיל.</p><div className="price"><b>290 ₪</b></div><Link className="go" to="/courses">לפרטי הקורס</Link></article>
          <article className="card course rv"><div className="shot wide"><img className="ph" src="/images/home/advanced-course.webp" alt="" loading="lazy" decoding="async" /><div className="play" aria-hidden="true"><i></i></div></div><div className="meta"><span>8 שיעורים</span><span>מתקדמות</span></div><h3><Link to="/courses">טכניקות עיצוב מתקדמות</Link></h3><p>שכבות, צבעים וטכניקות עיצוב מתקדמות, לדיוק גבוה יותר ולתוצאה מלוטשת.</p><p className="for">מתאים למי שכבר מכינה עוגיות ורוצה לקחת את העבודה צעד קדימה.</p><div className="price"><b>390 ₪</b></div><Link className="go" to="/courses">לפרטי הקורס</Link></article>
        </div>
        <p className="demo">* שמות הקורסים, המחירים ומספר השיעורים הם נתוני הדגמה.</p>
      </div></section>

      <section className="vids" id="videos"><div className="wrap">
        <div className="sec-head rv"><div><div className="eyebrow">תוכן חינמי</div><h2>קצת ידע, <em>בחינם.</em></h2><p>לא כל דבר חייב להתחיל בקנייה. לפעמים טיפ אחד טוב הוא בדיוק מה שצריך כדי לנסות, להבין — ולהתאהב בתהליך.</p></div><Link className="more" to="/videos">לכל הסרטונים</Link></div>
        <div className="grid3">
          <article className="card rv"><div className="shot" aria-hidden="true"><div className="play" aria-hidden="true"><i></i></div></div><div><h3><Link to="/videos">איך מכינים אייסינג בעקביות הנכונה</Link></h3><p>הבסיס שיכול לחסוך לך לא מעט ניסיונות ותסכול.</p></div></article>
          <article className="card rv"><div className="shot" aria-hidden="true"><div className="play" aria-hidden="true"><i></i></div></div><div><h3><Link to="/videos">קווי מתאר בלי רעידות</Link></h3><p>איך עובדים עם האייסינג בצורה יציבה, מדויקת ונעימה יותר.</p></div></article>
          <article className="card rv"><div className="shot" aria-hidden="true"><div className="play" aria-hidden="true"><i></i></div></div><div><h3><Link to="/videos">שילוב צבעים בעוגייה אחת</Link></h3><p>איך בונים פלטת צבעים שנראית מחוברת — ולא סתם צבעונית.</p></div></article>
        </div>
      <p className="media-note">הסרטונים מוצגים להמחשה; תוכן לצפייה יתווסף בהמשך.</p></div></section>

      <section className="final"><div className="wrap rv">
        <h2>יש עוגיות להזמין. <em>ויש עולם שלם ללמוד.</em></h2>
        <p>בואי לבחור איך מתחילים.</p>
        <div className="actions"><Link className="btn primary" to="/catalog">להזמנת עוגיות</Link><Link className="btn secondary" to="/courses">לצפייה בקורסים</Link></div>
      </div></section>
      </main>

      <BrandFooter />
    </div>
  );
}
