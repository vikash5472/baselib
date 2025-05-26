import { Readable } from 'stream';
import {
  UploadOptions,
  PresignOptions,
  UploadResult,
  CloudAdapter,
  CloudProvider,
  GlobalUploadConfig,
  SpecificCredentials,
  AwsCredentials,
  GcpCredentials,
  AzureCredentials,
} from './types';
import { AwsAdapter } from './aws.adapter';
import { GcpAdapter } from './gcp.adapter';
import { AzureAdapter } from './azure.adapter';
import { AppError } from '../errors/app-error';

class UploadManager {
  private globalConfig: GlobalUploadConfig | undefined;
  private adapters: Map<CloudProvider, CloudAdapter>;

  constructor() {
    this.adapters = new Map();
  }

  public configure(config: GlobalUploadConfig): void {
    this.globalConfig = config;
  }

  private getAdapter(provider: CloudProvider): CloudAdapter {
    if (!this.adapters.has(provider)) {
      switch (provider) {
        case 'aws':
          this.adapters.set('aws', new AwsAdapter());
          break;
        case 'gcp':
          this.adapters.set('gcp', new GcpAdapter());
          break;
        case 'azure':
          this.adapters.set('azure', new AzureAdapter());
          break;
        default:
          throw new AppError(`Unsupported cloud provider: ${provider}`, 400);
      }
    }
    return this.adapters.get(provider)!;
  }

  private resolveOptions<T extends UploadOptions | PresignOptions>(options: T): T & { provider: CloudProvider; credentials: SpecificCredentials } {
    const resolvedProvider = options.provider || this.globalConfig?.defaultProvider;
    const resolvedCredentials = options.credentials || this.globalConfig?.credentials;

    if (!resolvedProvider) {
      throw new AppError('Cloud provider is not specified and no global default is configured.', 400);
    }
    if (!resolvedCredentials) {
      throw new AppError(`Credentials for provider ${resolvedProvider} are not specified and no global default is configured.`, 400);
    }

    // Ensure the resolved credentials match the resolved provider
    if (resolvedCredentials.provider !== resolvedProvider) {
      throw new AppError(`Mismatched credentials: provided credentials are for ${resolvedCredentials.provider} but resolved provider is ${resolvedProvider}.`, 400);
    }

    return {
      ...options,
      provider: resolvedProvider,
      credentials: resolvedCredentials,
    } as T & { provider: CloudProvider; credentials: SpecificCredentials };
  }

  async uploadFile(bufferOrStream: Buffer | Readable, options: UploadOptions): Promise<UploadResult> {
    const resolvedOptions = this.resolveOptions(options);
    const { provider, isRequired } = resolvedOptions;

    if (isRequired && (!bufferOrStream || (bufferOrStream instanceof Buffer && bufferOrStream.length === 0))) {
      throw new AppError('File is required', 400);
    }

    const adapter = this.getAdapter(provider);
    return adapter.uploadFile(bufferOrStream, resolvedOptions);
  }

  async generatePresignedUrl(options: PresignOptions): Promise<{ url: string, fields?: any }> {
    const resolvedOptions = this.resolveOptions(options);
    const { provider } = resolvedOptions;

    const adapter = this.getAdapter(provider);
    return adapter.generatePresignedUrl(resolvedOptions);
  }
}

export const uploadManager = new UploadManager();
