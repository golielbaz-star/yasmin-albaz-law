export const CASE_STATUSES = [
  { id: 'new',      label: 'תיק חדש',      color: 'bg-blue-100 text-blue-700' },
  { id: 'active',   label: 'בטיפול',        color: 'bg-purple-100 text-purple-700' },
  { id: 'waiting',  label: 'ממתין',         color: 'bg-yellow-100 text-yellow-700' },
  { id: 'hearing',  label: 'דיון קרוב',     color: 'bg-orange-100 text-orange-700' },
  { id: 'done',     label: 'הושלם',         color: 'bg-green-100 text-green-700' },
  { id: 'closed',   label: 'סגור',          color: 'bg-gray-100 text-gray-700' },
] as const

export type CaseStatusId = typeof CASE_STATUSES[number]['id']

export function getStatus(id: string) {
  return CASE_STATUSES.find(s => s.id === id) ?? CASE_STATUSES[0]
}
