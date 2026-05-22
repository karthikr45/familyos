import { BadRequestException, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';

/**
 * Validates and transforms a request payload against a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(CreateExpenseSchema)) dto: CreateExpenseInput`
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.errors) {
          const key = issue.path.join('.') || '_';
          (fieldErrors[key] ??= []).push(issue.message);
        }
        throw new BadRequestException({ message: 'Validation failed', errors: fieldErrors });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}
