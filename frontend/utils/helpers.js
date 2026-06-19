export const getHashColor = (name) => {
  if (!name) return '#22d3ee';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Curated list of glowing modern developer colors
  const colors = [
    '#22d3ee', // Cyan
    '#c084fc', // Light Purple
    '#f472b6', // Light Pink
    '#fb7185', // Rose
    '#34d399', // Emerald
    '#fbbf24', // Amber
    '#60a5fa', // Blue
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
