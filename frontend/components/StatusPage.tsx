import type { ReactNode } from "react";

type StatusPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footnote?: ReactNode;
};

export default function StatusPage({ eyebrow, title, description, children, footnote }: StatusPageProps) {
  return (
    <div className="mx-auto my-4 w-100" style={{ maxWidth: "28rem" }}>
      <div className="border rounded-3 bg-body p-4">
        <p className="mb-1 small fw-semibold text-uppercase text-body-secondary">{eyebrow}</p>
        <h1 className="h3 mb-2">{title}</h1>
        <p className="text-body-secondary mb-4">{description}</p>
        <div className="d-flex flex-wrap gap-2">{children}</div>
        {footnote ? <p className="small text-body-secondary font-monospace mt-3 mb-0">{footnote}</p> : null}
      </div>
    </div>
  );
}
