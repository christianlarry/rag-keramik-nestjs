export interface UnitOfWork {
  // Define methods for transaction management here
  run<T>(work: () => Promise<T>): Promise<T>;
}