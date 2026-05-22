import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly region: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('aws.bucket') ?? '';
    this.region = this.config.get<string>('aws.region') ?? 'ap-south-1';
    const accessKeyId = this.config.get<string>('aws.accessKeyId') ?? '';
    const secretAccessKey = this.config.get<string>('aws.secretAccessKey') ?? '';

    this.client =
      this.bucket && accessKeyId && secretAccessKey
        ? new S3Client({ region: this.region, credentials: { accessKeyId, secretAccessKey } })
        : null;
  }

  private key(prefix: string, filename: string): string {
    const ext = filename.includes('.') ? filename.split('.').pop() : 'bin';
    return `${prefix}/${randomUUID()}.${ext}`;
  }

  /** Upload a buffer and return the public object URL. */
  async upload(
    prefix: string,
    file: { buffer: Buffer; originalname: string; mimetype: string },
  ): Promise<string> {
    const key = this.key(prefix, file.originalname);

    if (!this.client) {
      // In local/dev without S3 credentials we return a deterministic pseudo-URL
      // so the flow remains testable. Replace with real storage in production.
      this.logger.warn('S3 not configured — returning a placeholder URL for uploaded file');
      return `https://local.familyos.invalid/${key}`;
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Generate a presigned PUT URL for direct client uploads. */
  async getPresignedUploadUrl(prefix: string, filename: string): Promise<string> {
    if (!this.client) return `https://local.familyos.invalid/${this.key(prefix, filename)}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: this.key(prefix, filename) });
    return getSignedUrl(this.client, command, { expiresIn: 900 });
  }
}
