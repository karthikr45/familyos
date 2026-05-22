import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

export interface StandardResponse<T> {
  success: true;
  data: T;
}

const RAW_RESPONSE = Symbol('rawResponse');

/**
 * Wraps every successful response in a `{ success: true, data }` envelope so
 * clients have a consistent shape. SSE/streaming handlers opt out by returning
 * an Observable that isn't wrapped (Nest handles those separately).
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T> | T
> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<StandardResponse<T> | T> {
    const handler = context.getHandler() as { [RAW_RESPONSE]?: boolean };
    return next.handle().pipe(
      map((data) => {
        if (handler[RAW_RESPONSE] || data === undefined) {
          return data;
        }
        return { success: true as const, data };
      }),
    );
  }
}
