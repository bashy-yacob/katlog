export function authErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-email': return 'פרטי ההתחברות אינם תקינים.';
    case 'auth/too-many-requests': return 'בוצעו ניסיונות רבים מדי. נסי שוב מאוחר יותר.';
    case 'auth/network-request-failed': return 'לא ניתן להתחבר לרשת. בדקי את החיבור ונסי שוב.';
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token':
    case 'auth/user-disabled': return 'ההתחברות פגה או שהחשבון אינו זמין. התחברי מחדש.';
    default: return 'לא הצלחנו להשלים את הפעולה. נסי שוב.';
  }
}
