import type { PrismaClient } from '@prisma/client';
import { prisma as defaultClient } from '../index';

/**
 * A minimal Prisma model delegate surface shared by every generated model.
 * Repositories are typed against this so the base class can offer generic
 * CRUD helpers without depending on a specific model.
 */
export interface PrismaDelegate<T> {
  findUnique(args: any): Promise<T | null>;
  findFirst(args: any): Promise<T | null>;
  findMany(args?: any): Promise<T[]>;
  create(args: any): Promise<T>;
  update(args: any): Promise<T>;
  delete(args: any): Promise<T>;
  count(args?: any): Promise<number>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Base repository implementing the common CRUD + pagination patterns every
 * concrete repository needs. Concrete repositories pass the relevant Prisma
 * delegate (e.g. `prisma.user`) and extend with domain-specific queries.
 */
export abstract class BaseRepository<T, Delegate extends PrismaDelegate<T>> {
  protected readonly prisma: PrismaClient;
  protected abstract get delegate(): Delegate;

  constructor(client: PrismaClient = defaultClient) {
    this.prisma = client;
  }

  findById(id: string): Promise<T | null> {
    return this.delegate.findUnique({ where: { id } });
  }

  findMany(args?: Parameters<Delegate['findMany']>[0]): Promise<T[]> {
    return this.delegate.findMany(args);
  }

  create(data: Parameters<Delegate['create']>[0]['data']): Promise<T> {
    return this.delegate.create({ data });
  }

  update(id: string, data: Parameters<Delegate['update']>[0]['data']): Promise<T> {
    return this.delegate.update({ where: { id }, data });
  }

  delete(id: string): Promise<T> {
    return this.delegate.delete({ where: { id } });
  }

  count(where?: Record<string, unknown>): Promise<number> {
    return this.delegate.count({ where });
  }

  async paginate(
    where: Record<string, unknown> = {},
    { page = 1, pageSize = 20 }: PaginationParams = {},
    extra: Record<string, unknown> = {},
  ): Promise<PaginatedResult<T>> {
    const take = Math.min(Math.max(pageSize, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [items, total] = await Promise.all([
      this.delegate.findMany({ where, skip, take, ...extra }),
      this.delegate.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }
}
