import { Readable } from 'stream';

export type CloudProvider = 'aws' | 'gcp' | 'azure';

export interface AwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

export interface GcpCredentials {
  gcpKeyFilePath?: string;
  projectId?: string; // Often needed for GCS, though can be inferred from key file
}

export interface AzureCredentials {
  azureConnectionString: string;
}

export type SpecificCredentials =
  | ({ provider: 'aws' } & AwsCredentials)
  | ({ provider: 'gcp' } & GcpCredentials)
  | ({ provider: 'azure' } & AzureCredentials);

export interface GlobalUploadConfig {
  defaultProvider: CloudProvider;
  credentials: SpecificCredentials;
}

export interface UploadOptions {
  provider?: CloudProvider; // Optional if global config is set
  key: string; // filename or destination path
  mimeType?: string;
  bucket?: string;
  isRequired?: boolean;
  credentials?: SpecificCredentials; // Optional if global config is set, or overrides global
}

export interface PresignOptions {
  provider?: CloudProvider; // Optional if global config is set
  key: string;
  mimeType?: string;
  bucket?: string;
  credentials?: SpecificCredentials; // Optional if global config is set, or overrides global
  expiresIn?: number; // in seconds
}

export interface UploadResult {
  url: string;
  key: string;
  bucket?: string;
  provider: CloudProvider;
}

export interface CloudAdapter {
  uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult>;
  generatePresignedUrl(options: PresignOptions): Promise<{ url: string, fields?: any }>;
}
