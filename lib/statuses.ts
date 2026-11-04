export const CASE_STATUSES = [
  { id: 'new',           label: 'תיק חדש',          color: 'bg-blue-100 text-blue-700' },
  { id: 'scheduling',   label: 'תיאום חתימה',       color: 'bg-purple-100 text-purple-700' },
  { id: 'waiting_sign', label: 'ממתין לחתימה',      color: 'bg-yellow-100 text-yellow-700' },
  { id: 'signed',       label: 'נחתם',              color: 'bg-green-100 text-green-700' },
  { id: 'scanning',     label: 'סריקת מסמכים',      color: 'bg-orange-100 text-orange-700' },
  { id: 'registering',  label: 'רישום בטוחות',      color: 'bg-pink-100 text-pink-700' },
  { id: 'sent',         label: 'נשלח לחברה',        color: 'bg-indigo-100 text-indigo-700' },
  { id: 'done',         label: 'הושלם',             color: 'bg-gray-100 text-gray-700' },
] as const

export type CaseStatusId = typeof CASE_STATUSES[number]['id']

export function getStatus(id: string) {
  return CASE_STATUSES.find(s => s.id === id) ?? CASE_STATUSES[0]
}
