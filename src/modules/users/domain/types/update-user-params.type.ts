import { CreateUserParams } from "./create-user-params.type";

export type UpdateUserParams = Partial<Omit<CreateUserParams, 'address' | 'email'>>