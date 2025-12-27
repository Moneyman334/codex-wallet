import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format cryptocurrency balance with thousand separators and consistent decimals
 * @param balance - The balance as a string or number
 * @param decimals - Number of decimal places (default: 4)
 * @param addCommas - Whether to add thousand separators (default: true)
 * @returns Formatted balance string
 */
export function formatCryptoBalance(
  balance: string | number,
  decimals: number = 4,
  addCommas: boolean = true
): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  if (isNaN(num)) {
    return '0.' + '0'.repeat(decimals);
  }
  
  const fixed = num.toFixed(decimals);
  
  if (!addCommas) {
    return fixed;
  }
  
  // Split into integer and decimal parts
  const [intPart, decPart] = fixed.split('.');
  
  // Add thousand separators to integer part
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

/**
 * Format balance from wei/smallest unit to main unit with proper formatting
 * @param balance - Balance in wei/smallest unit (as bigint or string)
 * @param decimals - Token decimals (default: 18)
 * @param displayDecimals - Number of decimals to show (default: 4)
 * @returns Formatted balance string
 */
export function formatBalanceFromWei(
  balance: bigint | string,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const balanceBigInt = typeof balance === 'string' ? BigInt(balance) : balance;
    
    // Calculate divisor (10^decimals)
    let divisor = BigInt(1);
    for (let i = 0; i < decimals; i++) {
      divisor = divisor * BigInt(10);
    }
    
    const intPart = balanceBigInt / divisor;
    const remainder = balanceBigInt % divisor;
    
    // Get fractional part with proper padding
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, displayDecimals);
    const fullBalance = `${intPart.toString()}.${fractional}`;
    
    // Format with thousand separators
    return formatCryptoBalance(fullBalance, displayDecimals, true);
  } catch (error) {
    console.error("Balance conversion error:", error);
    return '0.' + '0'.repeat(displayDecimals);
  }
}
