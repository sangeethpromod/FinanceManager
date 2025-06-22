export const filterFinanceByDate = (data: any[], start: string, end: string) => {
  const from = new Date(start);
  const to = new Date(end);
  return data.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= from && entryDate <= to;
  });
};