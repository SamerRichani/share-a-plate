import { Link } from 'react-router';

function Button({
  children,
  className = '',
  href,
  to,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ');
  const Element = to ? Link : href ? 'a' : 'button';

  return (
    <Element
      className={classes}
      {...(to ? { to } : href ? { href } : { type })}
      {...props}
    >
      {children}
    </Element>
  );
}

export default Button;
