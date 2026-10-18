import type { ReactNode } from 'react';

type PageStateProps = { title: string; description: string; action?: ReactNode; headingLevel?: 1 | 2 };

export default function PageState({ title, description, action, headingLevel = 2 }: PageStateProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="ui-state">
      <span className="ui-state-mark" aria-hidden="true" />
      <Heading>{title}</Heading>
      <p>{description}</p>
      {action && <div className="ui-actions">{action}</div>}
    </div>
  );
}
