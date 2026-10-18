import type { ReactNode } from 'react';

type PageHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export default function PageHeading({ eyebrow, title, description, actions }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <div>
        <p className="ui-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-heading-description">{description}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  );
}
