export const formatDateClean = (dateInput, includeTime = false) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  
  let dateStr = `${day}-${month}-${year}`;
  
  if (includeTime) {
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    dateStr += `, ${hours}:${minutes} ${ampm}`;
  }
  
  return dateStr;
};
