import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClient, AiServices } from '@familyos/ai';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Wraps the @familyos/ai service bundle, attaching per-user token-usage
 * tracking. A fresh AiServices instance is created per user so usage is
 * attributed correctly to the AiUsage table.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;

  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = config.get<string>('anthropic.apiKey') ?? '';
  }

  servicesFor(userId: string): AiServices {
    const client = new AiClient({
      apiKey: this.apiKey,
      onUsage: async (feature, usage) => {
        try {
          await this.prisma.aiUsage.create({
            data: {
              userId,
              feature,
              inputTokens: usage.inputTokens,
              outputTokens: usage.outputTokens,
            },
          });
        } catch (error) {
          this.logger.warn(`Failed to record AI usage: ${(error as Error).message}`);
        }
      },
    });
    return new AiServices(client);
  }

  async getUsageStats(userId: string) {
    const grouped = await this.prisma.aiUsage.groupBy({
      by: ['feature'],
      where: { userId },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    });
    const totals = grouped.reduce(
      (acc, g) => {
        acc.inputTokens += g._sum.inputTokens ?? 0;
        acc.outputTokens += g._sum.outputTokens ?? 0;
        acc.calls += g._count;
        return acc;
      },
      { inputTokens: 0, outputTokens: 0, calls: 0 },
    );
    return { totals, byFeature: grouped };
  }
}
