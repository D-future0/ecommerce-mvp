import Link from "next/link";

export function Pagination({
  page,
  pages,
  makeHref,
}: {
  page: number;
  pages: number;
  makeHref: (page: number) => string;
}) {
  if (pages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-6 text-sm">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className="text-ink underline underline-offset-2">
          Previous
        </Link>
      ) : (
        <span className="text-stone">Previous</span>
      )}
      <span className="text-stone">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} className="text-ink underline underline-offset-2">
          Next
        </Link>
      ) : (
        <span className="text-stone">Next</span>
      )}
    </div>
  );
}
