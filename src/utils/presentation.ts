/** Translate stored category identifiers without changing the stored values. */
export function productCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    cookies: 'עוגיות',
    cakes: 'עוגות',
    cupcakes: 'קאפקייקס',
    custom: 'עיצוב מותאם',
  };
  return labels[category] ?? category;
}
