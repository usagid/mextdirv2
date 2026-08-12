import * as Sentry from "@sentry/nuxt";

Sentry.init({
	// Server Sentry initializes before Nuxt runtime config is available.
	dsn: process.env.SENTRY_DSN,

	// We recommend adjusting this value in production, or using tracesSampler
	// for finer control
	tracesSampleRate: 1.0,

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
