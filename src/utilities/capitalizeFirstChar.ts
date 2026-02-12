// Helper function to capitalize the first character of a string if it's lowercase
export const capitalizeFirstChar = (value: string): string => {
  if (value && value.length > 0 && value[0] === value[0].toLowerCase()) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return value;
};
