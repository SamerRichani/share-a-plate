import Button from './ui/Button';

function Pagination({ page, onChange, hasNext, label = 'offers' }) {
  if (page === 1 && !hasNext) return null;

  return (
    <nav className="pagination" aria-label={`${label} pages`}>
      <Button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        variant="outline"
      >
        Previous
      </Button>
      <span aria-live="polite">Page {page}</span>
      <Button
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
        variant="outline"
      >
        Next
      </Button>
    </nav>
  );
}

export default Pagination;
