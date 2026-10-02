import CaseDetailsClient from './CaseDetailsClient';

// Static export requires at least one entry; real case data is fetched client-side.
export function generateStaticParams() {
  return [{ id: '0' }];
}

export default async function CaseDetailsPage({ params }) {
  const { id } = await params;
  return <CaseDetailsClient caseId={id} />;
}
