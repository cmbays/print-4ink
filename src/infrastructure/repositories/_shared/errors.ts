export type DalErrorCode = 'NOT_FOUND' | 'VALIDATION' | 'PROVIDER' | 'UNKNOWN'

export class DalError extends Error {
  constructor(
    public readonly code: DalErrorCode,
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'DalError'
  }
}
