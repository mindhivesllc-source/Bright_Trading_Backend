import {
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';

import {
  PostHog,
} from 'posthog-node';

@Injectable()
export class PostHogService implements OnModuleDestroy {
  readonly client: PostHog | undefined;

  constructor() {
    const projectToken = process.env.POSTHOG_PROJECT_TOKEN;
    const host = process.env.POSTHOG_HOST;

    if (!projectToken || !host) {
      if (process.env.NODE_ENV !== 'production') {
        const variable = projectToken
          ? 'POSTHOG_HOST'
          : 'POSTHOG_PROJECT_TOKEN';

        // Warn instead of throwing: a missing analytics key must never stop the API.
        console.warn(
          `${variable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This warning stops appearing once ${variable} is configured`,
        );
      }

      return;
    }

    this.client = new PostHog(
      projectToken,
      {
        host,
        enableExceptionAutocapture: true,
      },
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.shutdown();
  }
}
