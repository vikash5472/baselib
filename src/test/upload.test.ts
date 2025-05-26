import { uploadManager } from '../upload/upload.manager';
import { AppError } from '../errors/app-error';
import { Readable } from 'stream';

// Mock AWS SDK
const mockPutObjectCommand = jest.fn();
const mockGetSignedUrl = jest.fn();
const mockS3ClientSend = jest.fn(() => Promise.resolve({}));

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({
    send: mockS3ClientSend,
  })),
  PutObjectCommand: jest.fn((params) => {
    mockPutObjectCommand(params);
    return params;
  }),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn((client, command, options) => {
    mockGetSignedUrl(client, command, options);
    return Promise.resolve('https://mock-aws-presigned-url.com/test-key');
  }),
}));

// Mock GCP SDK
const mockGcsCreateWriteStream = jest.fn();
const mockGcsGetSignedUrl = jest.fn();
const mockGcsBucketFile = jest.fn(() => ({
  createWriteStream: mockGcsCreateWriteStream,
  getSignedUrl: mockGcsGetSignedUrl,
}));
const mockGcsBucket = jest.fn(() => ({
  file: mockGcsBucketFile,
}));

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(() => ({
    bucket: mockGcsBucket,
  })),
}));

// Mock Azure SDK
const mockAzureUpload = jest.fn();
const mockAzureUploadStream = jest.fn();
const mockAzureGenerateSasUrl = jest.fn();
const mockAzureGetContainerClient = jest.fn(() => ({
  createIfNotExists: jest.fn(() => Promise.resolve()),
  getBlockBlobClient: jest.fn(() => ({
    upload: mockAzureUpload,
    uploadStream: mockAzureUploadStream,
    generateSasUrl: mockAzureGenerateSasUrl,
    url: 'https://mock-azure-blob-url.com/test-container/test-key',
  })),
}));

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: {
    fromConnectionString: jest.fn(() => ({
      getContainerClient: mockAzureGetContainerClient,
    })),
  },
  BlobSASPermissions: {
    from: jest.fn((permissions) => permissions),
  },
}));

describe('UploadManager', () => {
  const mockBuffer = Buffer.from('test data');
  const mockStream = Readable.from('test stream data');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global config before each test
    (uploadManager as any).globalConfig = undefined;
    (uploadManager as any).adapters = new Map(); // Clear lazy loaded adapters
  });

  // --- Global Configuration Tests ---
  test('should configure global settings', () => {
    const config = {
      defaultProvider: 'aws' as const,
      credentials: {
        provider: 'aws' as const,
        accessKeyId: 'global-aws-key',
        secretAccessKey: 'global-aws-secret',
        region: 'us-east-1',
      },
    };
    uploadManager.configure(config);
    expect((uploadManager as any).globalConfig).toEqual(config);
  });

  // --- Upload File Tests ---

  describe('uploadFile', () => {
    test('should throw AppError if file is required but not provided', async () => {
      await expect(uploadManager.uploadFile(Buffer.from(''), {
        key: 'test',
        isRequired: true,
        provider: 'aws',
        bucket: 'test-bucket',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      })).rejects.toThrow(new AppError('File is required', 400));

      await expect(uploadManager.uploadFile(null as any, { // Test with null/undefined
        key: 'test',
        isRequired: true,
        provider: 'aws',
        bucket: 'test-bucket',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      })).rejects.toThrow(new AppError('File is required', 400));
    });

    test('should throw AppError if provider is not specified and no global config', async () => {
      await expect(uploadManager.uploadFile(mockBuffer, {
        key: 'test',
        bucket: 'test-bucket',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      })).rejects.toThrow(new AppError('Cloud provider is not specified and no global default is configured.', 400));
    });

    test('should throw AppError if credentials are not specified and no global config', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      });
      (uploadManager as any).globalConfig.credentials = undefined; // Simulate missing global credentials

      await expect(uploadManager.uploadFile(mockBuffer, {
        key: 'test',
        bucket: 'test-bucket',
        provider: 'aws',
      })).rejects.toThrow(new AppError('Credentials for provider aws are not specified and no global default is configured.', 400));
    });

    test('should throw AppError for mismatched credentials', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      });

      await expect(uploadManager.uploadFile(mockBuffer, {
        key: 'test',
        bucket: 'test-bucket',
        provider: 'aws',
        credentials: { provider: 'gcp', gcpKeyFilePath: 'path' }, // Mismatched
      })).rejects.toThrow(new AppError('Mismatched credentials: provided credentials are for gcp but resolved provider is aws.', 400));
    });

    // AWS Upload Tests
    test('should upload file to AWS S3 using explicit options', async () => {
      const options = {
        provider: 'aws' as const,
        key: 'test-aws-key',
        mimeType: 'image/jpeg',
        bucket: 'test-aws-bucket',
        credentials: {
          provider: 'aws' as const,
          accessKeyId: 'aws-key',
          secretAccessKey: 'aws-secret',
          region: 'ap-south-1',
        },
      };
      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockS3ClientSend).toHaveBeenCalledTimes(1);
      expect(mockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-aws-bucket',
        Key: 'test-aws-key',
        Body: mockBuffer,
        ContentType: 'image/jpeg',
      });
      expect(result).toEqual({
        url: 'https://test-aws-bucket.s3.ap-south-1.amazonaws.com/test-aws-key',
        key: 'test-aws-key',
        bucket: 'test-aws-bucket',
        provider: 'aws',
      });
    });

    test('should upload file to AWS S3 using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: {
          provider: 'aws',
          accessKeyId: 'global-aws-key',
          secretAccessKey: 'global-aws-secret',
          region: 'us-east-1',
        },
      });

      const options = {
        key: 'global-aws-key',
        mimeType: 'text/plain',
        bucket: 'global-aws-bucket',
      };
      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockS3ClientSend).toHaveBeenCalledTimes(1);
      expect(mockPutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'global-aws-bucket',
        Key: 'global-aws-key',
        Body: mockBuffer,
        ContentType: 'text/plain',
      });
      expect(result).toEqual({
        url: 'https://global-aws-bucket.s3.us-east-1.amazonaws.com/global-aws-key',
        key: 'global-aws-key',
        bucket: 'global-aws-bucket',
        provider: 'aws',
      });
    });

    // GCP Upload Tests
    test('should upload file to GCP using explicit options', async () => {
      const options = {
        provider: 'gcp' as const,
        key: 'test-gcp-key',
        mimeType: 'application/json',
        bucket: 'test-gcp-bucket',
        credentials: {
          provider: 'gcp' as const,
          gcpKeyFilePath: 'path/to/gcp-key.json',
        },
      };

      mockGcsCreateWriteStream.mockImplementationOnce((opts) => {
        const ws = new Readable({ read() { } });
        process.nextTick(() => {
          ws.emit('finish');
        });
        return ws;
      });

      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockGcsBucket).toHaveBeenCalledWith('test-gcp-bucket');
      expect(mockGcsBucketFile).toHaveBeenCalledWith('test-gcp-key');
      expect(mockGcsCreateWriteStream).toHaveBeenCalledWith({
        metadata: { contentType: 'application/json' },
      });
      expect(result).toEqual({
        url: 'https://storage.googleapis.com/test-gcp-bucket/test-gcp-key',
        key: 'test-gcp-key',
        bucket: 'test-gcp-bucket',
        provider: 'gcp',
      });
    });

    test('should upload file to GCP using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'gcp',
        credentials: {
          provider: 'gcp',
          gcpKeyFilePath: 'path/to/global-gcp-key.json',
        },
      });

      const options = {
        key: 'global-gcp-key',
        mimeType: 'text/csv',
        bucket: 'global-gcp-bucket',
      };

      mockGcsCreateWriteStream.mockImplementationOnce((opts) => {
        const ws = new Readable({ read() { } });
        process.nextTick(() => {
          ws.emit('finish');
        });
        return ws;
      });

      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockGcsBucket).toHaveBeenCalledWith('global-gcp-bucket');
      expect(mockGcsBucketFile).toHaveBeenCalledWith('global-gcp-key');
      expect(mockGcsCreateWriteStream).toHaveBeenCalledWith({
        metadata: { contentType: 'text/csv' },
      });
      expect(result).toEqual({
        url: 'https://storage.googleapis.com/global-gcp-bucket/global-gcp-key',
        key: 'global-gcp-key',
        bucket: 'global-gcp-bucket',
        provider: 'gcp',
      });
    });

    // Azure Upload Tests
    test('should upload file to Azure Blob using explicit options', async () => {
      const options = {
        provider: 'azure' as const,
        key: 'test-azure-key',
        mimeType: 'application/xml',
        bucket: 'test-azure-bucket',
        credentials: {
          provider: 'azure' as const,
          azureConnectionString: 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=test;EndpointSuffix=core.windows.net',
        },
      };

      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockAzureGetContainerClient).toHaveBeenCalledWith('test-azure-bucket');
      expect(mockAzureUpload).toHaveBeenCalledWith(mockBuffer, mockBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'application/xml' },
      });
      expect(result).toEqual({
        url: 'https://mock-azure-blob-url.com/test-container/test-key',
        key: 'test-azure-key',
        bucket: 'test-azure-bucket',
        provider: 'azure',
      });
    });

    test('should upload file to Azure Blob using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'azure',
        credentials: {
          provider: 'azure',
          azureConnectionString: 'DefaultEndpointsProtocol=https;AccountName=global;AccountKey=global;EndpointSuffix=core.windows.net',
        },
      });

      const options = {
        key: 'global-azure-key',
        mimeType: 'image/gif',
        bucket: 'global-azure-bucket',
      };

      const result = await uploadManager.uploadFile(mockBuffer, options);

      expect(mockAzureGetContainerClient).toHaveBeenCalledWith('global-azure-bucket');
      expect(mockAzureUpload).toHaveBeenCalledWith(mockBuffer, mockBuffer.length, {
        blobHTTPHeaders: { blobContentType: 'image/gif' },
      });
      expect(result).toEqual({
        url: 'https://mock-azure-blob-url.com/test-container/test-key',
        key: 'global-azure-key',
        bucket: 'global-azure-bucket',
        provider: 'azure',
      });
    });
  });

  // --- Generate Presigned URL Tests ---

  describe('generatePresignedUrl', () => {
    test('should throw AppError if provider is not specified and no global config', async () => {
      await expect(uploadManager.generatePresignedUrl({
        key: 'test',
        bucket: 'test-bucket',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      })).rejects.toThrow(new AppError('Cloud provider is not specified and no global default is configured.', 400));
    });

    test('should throw AppError if credentials are not specified and no global config', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      });
      (uploadManager as any).globalConfig.credentials = undefined; // Simulate missing global credentials

      await expect(uploadManager.generatePresignedUrl({
        key: 'test',
        bucket: 'test-bucket',
        provider: 'aws',
      })).rejects.toThrow(new AppError('Credentials for provider aws are not specified and no global default is configured.', 400));
    });

    test('should throw AppError for mismatched credentials', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: { provider: 'aws', accessKeyId: 'a', secretAccessKey: 's', region: 'r' },
      });

      await expect(uploadManager.generatePresignedUrl({
        key: 'test',
        bucket: 'test-bucket',
        provider: 'aws',
        credentials: { provider: 'gcp', gcpKeyFilePath: 'path' }, // Mismatched
      })).rejects.toThrow(new AppError('Mismatched credentials: provided credentials are for gcp but resolved provider is aws.', 400));
    });

    // AWS Presigned URL Tests
    test('should generate presigned URL for AWS S3 using explicit options', async () => {
      const options = {
        provider: 'aws' as const,
        key: 'presigned-aws-key',
        mimeType: 'image/png',
        bucket: 'presigned-aws-bucket',
        expiresIn: 120,
        credentials: {
          provider: 'aws' as const,
          accessKeyId: 'aws-key',
          secretAccessKey: 'aws-secret',
          region: 'ap-south-1',
        },
      };
      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object), // S3Client instance
        expect.objectContaining({ Bucket: 'presigned-aws-bucket', Key: 'presigned-aws-key', ContentType: 'image/png' }),
        { expiresIn: 120 }
      );
      expect(result).toEqual({ url: 'https://mock-aws-presigned-url.com/test-key' });
    });

    test('should generate presigned URL for AWS S3 using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'aws',
        credentials: {
          provider: 'aws',
          accessKeyId: 'global-aws-key',
          secretAccessKey: 'global-aws-secret',
          region: 'us-east-1',
        },
      });

      const options = {
        key: 'global-presigned-aws-key',
        mimeType: 'video/mp4',
        bucket: 'global-presigned-aws-bucket',
        expiresIn: 600,
      };
      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ Bucket: 'global-presigned-aws-bucket', Key: 'global-presigned-aws-key', ContentType: 'video/mp4' }),
        { expiresIn: 600 }
      );
      expect(result).toEqual({ url: 'https://mock-aws-presigned-url.com/test-key' });
    });

    // GCP Presigned URL Tests
    test('should generate presigned URL for GCP using explicit options', async () => {
      const options = {
        provider: 'gcp' as const,
        key: 'presigned-gcp-key',
        mimeType: 'audio/wav',
        bucket: 'presigned-gcp-bucket',
        expiresIn: 300,
        credentials: {
          provider: 'gcp' as const,
          gcpKeyFilePath: 'path/to/presigned-gcp-key.json',
        },
      };

      mockGcsGetSignedUrl.mockResolvedValueOnce(['https://mock-gcp-signed-url.com/test-key']);

      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockGcsBucket).toHaveBeenCalledWith('presigned-gcp-bucket');
      expect(mockGcsBucketFile).toHaveBeenCalledWith('presigned-gcp-key');
      expect(mockGcsGetSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'write',
        expires: expect.any(Number), // Date.now() + expiresIn * 1000
        contentType: 'audio/wav',
      });
      expect(result).toEqual({ url: 'https://mock-gcp-signed-url.com/test-key' });
    });

    test('should generate presigned URL for GCP using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'gcp',
        credentials: {
          provider: 'gcp',
          gcpKeyFilePath: 'path/to/global-presigned-gcp-key.json',
        },
      });

      const options = {
        key: 'global-presigned-gcp-key',
        mimeType: 'application/zip',
        bucket: 'global-presigned-gcp-bucket',
        expiresIn: 900,
      };

      mockGcsGetSignedUrl.mockResolvedValueOnce(['https://mock-gcp-signed-url.com/global-test-key']);

      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockGcsBucket).toHaveBeenCalledWith('global-presigned-gcp-bucket');
      expect(mockGcsBucketFile).toHaveBeenCalledWith('global-presigned-gcp-key');
      expect(mockGcsGetSignedUrl).toHaveBeenCalledWith({
        version: 'v4',
        action: 'write',
        expires: expect.any(Number),
        contentType: 'application/zip',
      });
      expect(result).toEqual({ url: 'https://mock-gcp-signed-url.com/global-test-key' });
    });

    // Azure Presigned URL Tests
    test('should generate presigned URL for Azure Blob using explicit options', async () => {
      const options = {
        provider: 'azure' as const,
        key: 'presigned-azure-key',
        mimeType: 'application/octet-stream',
        bucket: 'presigned-azure-bucket',
        expiresIn: 60,
        credentials: {
          provider: 'azure' as const,
          azureConnectionString: 'DefaultEndpointsProtocol=https;AccountName=presigned;AccountKey=presigned;EndpointSuffix=core.windows.net',
        },
      };

      mockAzureGenerateSasUrl.mockResolvedValueOnce('https://mock-azure-sas-url.com/test-key');

      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockAzureGetContainerClient).toHaveBeenCalledWith('presigned-azure-bucket');
      expect(mockAzureGenerateSasUrl).toHaveBeenCalledWith(expect.objectContaining({
        containerName: 'presigned-azure-bucket',
        blobName: 'presigned-azure-key',
        permissions: { write: true },
        contentType: 'application/octet-stream',
        expiresOn: expect.any(Date),
        startsOn: expect.any(Date),
      }));
      expect(result).toEqual({ url: 'https://mock-azure-sas-url.com/test-key' });
    });

    test('should generate presigned URL for Azure Blob using global config', async () => {
      uploadManager.configure({
        defaultProvider: 'azure',
        credentials: {
          provider: 'azure',
          azureConnectionString: 'DefaultEndpointsProtocol=https;AccountName=global-presigned;AccountKey=global-presigned;EndpointSuffix=core.windows.net',
        },
      });

      const options = {
        key: 'global-presigned-azure-key',
        mimeType: 'application/x-tar',
        bucket: 'global-presigned-azure-bucket',
        expiresIn: 120,
      };

      mockAzureGenerateSasUrl.mockResolvedValueOnce('https://mock-azure-sas-url.com/global-test-key');

      const result = await uploadManager.generatePresignedUrl(options);

      expect(mockAzureGetContainerClient).toHaveBeenCalledWith('global-presigned-azure-bucket');
      expect(mockAzureGenerateSasUrl).toHaveBeenCalledWith(expect.objectContaining({
        containerName: 'global-presigned-azure-bucket',
        blobName: 'global-presigned-azure-key',
        permissions: { write: true },
        contentType: 'application/x-tar',
        expiresOn: expect.any(Date),
        startsOn: expect.any(Date),
      }));
      expect(result).toEqual({ url: 'https://mock-azure-sas-url.com/global-test-key' });
    });
  });
});
