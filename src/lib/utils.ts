export function formatDateVi(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeVi(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function calculateHoursBetween(startIso?: string, endIso?: string): number {
  if (!startIso || !endIso) return 0;
  try {
    const t1 = new Date(startIso).getTime();
    const t2 = new Date(endIso).getTime();
    const diffMs = Math.max(0, t2 - t1);
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
  } catch {
    return 0;
  }
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const content = [
    '\uFEFF' + headers.join(','), // Add BOM for Excel UTF-8 Vietnamese support
    ...rows.map(row => 
      row.map(cell => {
        const text = String(cell ?? '').replace(/"/g, '""');
        return `"${text}"`;
      }).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
