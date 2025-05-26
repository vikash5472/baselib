import { BlobServiceClient, BlockBlobClient, BlobSASPermissions } from '@azure/storage-blob';
import { Readable } from 'stream';
import { CloudAdapter, UploadOptions, PresignOptions, UploadResult, AzureCredentials } from './types';

export class AzureAdapter implements CloudAdapter {
  private getBlobServiceClient(credentials: AzureCredentials): BlobServiceClient {
    const { azureConnectionString } = credentials;
    return BlobServiceClient.fromConnectionString(azureConnectionString);
  }

  async uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult> {
    const { key, mimeType, bucket, credentials } = options;

    if (!bucket || !credentials || credentials.provider !== 'azure') {
      throw new Error('Azure bucket and valid Azure credentials are required for Azure Blob upload.');
    }
    const azureCredentials = credentials as AzureCredentials;

    const blobServiceClient = this.getBlobServiceClient(azureCredentials);
    const containerClient = blobServiceClient.getContainerClient(bucket);
    await containerClient.createIfNotExists();

    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(key);

    if (bufferOrStream instanceof Buffer) {
      await blockBlobClient.upload(bufferOrStream, bufferOrStream.length, {
        blobHTTPHeaders: { blobContentType: mimeType },
      });
    } else {
      // Ensure the stream is treated as a Readable for uploadStream
      await blockBlobClient.uploadStream(bufferOrStream as Readable, undefined, undefined, {
        blobHTTPHeaders: { blobContentType: mimeType },
      });
    }

    const url = blockBlobClient.url;
    return { url, key, bucket, provider: 'azure' };
  }

  async generatePresignedUrl(options: PresignOptions): Promise<{ url: string; fields?: any }> {
    const { key, mimeType, bucket, credentials, expiresIn = 3600 } = options;

    if (!bucket || !credentials || credentials.provider !== 'azure') {
      throw new Error('Azure bucket and valid Azure credentials are required for Azure presigned URL.');
    }
    const azureCredentials = credentials as AzureCredentials;

    const blobServiceClient = this.getBlobServiceClient(azureCredentials);
    const containerClient = blobServiceClient.getContainerClient(bucket);
    await containerClient.createIfNotExists();

    const blockBlobClient: BlockBlobClient = containerClient.getBlockBlobClient(key);

    // Azure Blob Storage uses Shared Access Signatures (SAS) for presigned URLs.
    // This example generates a user delegation SAS. For production, consider
    // using a stored access policy or service SAS with appropriate permissions.
    const sasOptions = {
      containerName: bucket,
      blobName: key,
      startsOn: new Date(),
      expiresOn: new Date(Date.now() + expiresIn * 1000),
      permissions: BlobSASPermissions.from({ write: true }), // Write permission
      contentType: mimeType,
    };

    // Note: User delegation SAS requires a user delegation key from the BlobServiceClient.
    // For simplicity, this example assumes a service SAS or a pre-existing user delegation key.
    // A full implementation would involve getting a user delegation key first.
    // For now, we'll generate a simple service SAS URL.
    const sasUrl = await blockBlobClient.generateSasUrl(sasOptions);

    return { url: sasUrl };
  }
}
