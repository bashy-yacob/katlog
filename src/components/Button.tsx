import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'quiet' | 'danger';
};

/** Shared button styling and native button semantics. */
export default function Button({ tone = 'primary', className = '', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={['brand-button', tone, className].join(' ')} {...props} />;
}
