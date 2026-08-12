import * as Sentry from "@sentry/nuxt";
import { useRuntimeConfig } from "#imports";

Sentry.init({
	// The DSN is supplied through Nuxt runtime config.
	dsn: useRuntimeConfig().public.sentry.dsn,

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 1.0,

	// This sets the sample rate to be 10%. You may want this to be 100% while
	// in development and sample at a lower rate in production
	replaysSessionSampleRate: 0.1,

	// If the entire session is not sampled, use the below sample rate to sample
	// sessions when an error occurs.
	replaysOnErrorSampleRate: 1.0,

	// If you don't want to use Session Replay, just remove the line below:
	integrations: [Sentry.replayIntegration()],

	// Enable logs to be sent to Sentry
	enableLogs: true,

	dataCollection: {
		// To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
		// https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#dataCollection
		// userInfo: false,
		// httpBodies: [],
	},

	// Setting this option to true will print useful information to the console while you're setting up Sentry.
	debug: false,
});
