import ProgramResultsClient from "./ProgramResultsClient";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function ProgramResultsPage({
  params,
}: {
  params: Promise<{ assessmentId: string; programInstanceId: string }>;
}) {
  const { assessmentId, programInstanceId } = await params;

  if (!isUuid(assessmentId) || !isUuid(programInstanceId)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        Parámetros inválidos.
      </div>
    );
  }

  return (
    <div className="w-full max-w-none">
      <ProgramResultsClient
        assessmentId={assessmentId}
        programInstanceId={programInstanceId}
      />
    </div>
  );
}
