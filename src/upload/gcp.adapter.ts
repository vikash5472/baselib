import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';
import { CloudAdapter, UploadOptions, PresignOptions, UploadResult, GcpCredentials } from './types';

export class GcpAdapter implements CloudAdapter {
  private getStorageClient(credentials: GcpCredentials): Storage {
    const { gcpKeyFilePath, projectId } = credentials;
    if (gcpKeyFilePath) {
      return new Storage({ keyFilename: gcpKeyFilePath, projectId });
    }
    return new Storage({ projectId }); // Uses GOOGLE_APPLICATION_CREDENTIALS env var or default
  }

  async uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult> {
    const { key, mimeType, bucket, credentials } = options;

    if (!bucket || !credentials || credentials.provider !== 'gcp') {
      throw new Error('GCP bucket and valid GCP credentials are required for Google Cloud Storage upload.');
    }
    const gcpCredentials = credentials as GcpCredentials;

    const storage = this.getStorageClient(gcpCredentials);
    const file = storage.bucket(bucket).file(key);

    await new Promise<void>((resolve, reject) => {
      const uploadStream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
        },
      });

      if (bufferOrStream instanceof Buffer) {
        const bufferStream = Readable.from(bufferOrStream);
        bufferStream.pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      } else {
        (bufferOrStream as Readable).pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      }
    });

    const url = `https://storage.googleapis.com/${bucket}/${key}`;
    return { url, key, bucket, provider: 'gcp' };
  }

  async generatePresignedUrl(options: PresignOptions): Promise<{ url: string; fields?: any }> {
    const { key, mimeType, bucket, credentials, expiresIn = 3600 } = options;

    if (!bucket || !credentials || credentials.provider !== 'gcp') {
      throw new Error('GCP bucket and valid GCP credentials are required for Google Cloud Storage presigned URL.');
    }
    const gcpCredentials = credentials as GcpCredentials;

    const storage = this.getStorageClient(gcpCredentials);
    const file = storage.bucket(bucket).file(key);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + expiresIn * 1000, // expiresIn is in seconds
      contentType: mimeType,
    });

    return { url };
  }
}
