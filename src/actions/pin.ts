'use server'

import { validatePin } from '@/lib/pin'

export async function checkPin(pin: string): Promise<boolean> {
  return validatePin(pin)
}
