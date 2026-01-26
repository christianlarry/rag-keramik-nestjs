import { IUserRepository } from "src/modules/users/domain";

// Interface context yang berisi repository yang siap transaksi
export interface IUnitOfWorkContext {
  userRepository: IUserRepository;
}

// Interface service utama untuk menjalankan transaksi
export interface IUnitOfWork {
  run<T>(work: (context: IUnitOfWorkContext) => Promise<T>): Promise<T>;
}