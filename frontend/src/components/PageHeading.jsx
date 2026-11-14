function PageHeading({ actions, eyebrow, title, description }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="page-heading__description">{description}</p>
        )}
      </div>
      {actions && <div className="page-heading__actions">{actions}</div>}
    </div>
  );
}

export default PageHeading;
