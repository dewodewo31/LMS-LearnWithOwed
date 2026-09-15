import { SUBMISSION_STATUS_LABELS } from './constants';

export default function SubmissionStatusBadge({ status, isLate }) {
  const label = isLate && status === 'submitted' ? 'Late' : SUBMISSION_STATUS_LABELS[status] || status;
  const styles =
    status === 'reviewed'
      ? 'bg-[#22C55E]/10 text-[#4ADE80]'
      : status === 'returned'
        ? 'bg-[#F59E0B]/10 text-[#FBBF24]'
        : isLate
          ? 'bg-[#F59E0B]/10 text-[#FBBF24]'
          : 'bg-primary-500/10 text-primary-400';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}
