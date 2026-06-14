export const formatCurrency = (amount: number, currencyCode: string = 'USD'): string => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    // Fallback if currency code is invalid
    return `$${amount.toFixed(2)}`;
  }
};
