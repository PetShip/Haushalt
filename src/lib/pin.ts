export function validatePin(pin: string): boolean {
  const adminPin = process.env.ADMIN_PIN
  
  if (!adminPin || adminPin === '') {
    return true // No PIN required
  }
  
  return pin === adminPin
}

export async function isPinRequired(): Promise<boolean> {
  const adminPin = process.env.ADMIN_PIN
  return adminPin !== undefined && adminPin !== ''
}
