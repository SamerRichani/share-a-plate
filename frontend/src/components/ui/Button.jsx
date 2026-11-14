function Button({
  children,
  className = '',
  href,
  type = 'button',
  variant = 'primary',
  ...props
}) {
  const classes = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ');
  const Element = href ? 'a' : 'button';

  return (
    <Element className={classes} {...(href ? { href } : { type })} {...props}>
      {children}
    </Element>
  );
}

export default Button;
