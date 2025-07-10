import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { CloudAdapter, UploadOptions, PresignOptions, UploadResult, AwsCredentials } from './types';

export class AwsAdapter implements CloudAdapter {
  private getS3Client(credentials: AwsCredentials): S3Client {
    const { region } = credentials;
    return new S3Client({
      region,
    });
  }

  async uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult> {
    const { key, mimeType, bucket, credentials } = options;

    if (!bucket || !credentials || credentials.provider !== 'aws') {
      throw new Error('AWS S3 bucket and valid AWS credentials are required for AWS upload.');
    }
    const awsCredentials = credentials as AwsCredentials;

    const client = this.getS3Client(awsCredentials);

    const uploadParams: PutObjectCommandInput = {
      Bucket: bucket,
      Key: key,
      Body: bufferOrStream,
      ContentType: mimeType,
    };

    await client.send(new PutObjectCommand(uploadParams));

    const url = `https://${bucket}.s3.${awsCredentials.region}.amazonaws.com/${key}`;
    return { url, key, bucket, provider: 'aws' };
  }

  async generatePresignedUrl(options: PresignOptions): Promise<{ url: string; fields?: any }> {
    const { key, mimeType, bucket, credentials, expiresIn = 3600 } = options;

    if (!bucket || !credentials || credentials.provider !== 'aws') {
      throw new Error('AWS S3 bucket and valid AWS credentials are required for AWS presigned URL.');
    }
    const awsCredentials = credentials as AwsCredentials;

    const client = this.getS3Client(awsCredentials);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(client, command, { expiresIn });
    return { url };
  }
}
