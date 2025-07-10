import { AppError } from './app-error';

export interface ErrorReporter {
    report(error: AppError): void;
}

export class SentryErrorReporter implements ErrorReporter {
    private sentry: any;

    constructor(sentryInstance: any) {
        this.sentry = sentryInstance;
    }

    public report(error: AppError): void {
        this.sentry.captureException(error, {
            extra: {
                statusCode: error.statusCode,
                type: error.type,
                context: error.context,
            },
        });
    }
}
