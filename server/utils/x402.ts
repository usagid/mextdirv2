import {
	getMethod,
	getRequestHeader,
	getRequestURL,
	setResponseHeaders,
	setResponseStatus,
} from "h3";
import type { H3Event } from "h3";
import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import {
	x402HTTPResourceServer,
	type HTTPAdapter,
	type HTTPRequestContext,
	type PaymentOption,
	type RouteConfig,
} from "@x402/core/http";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { ExactSvmScheme } from "@x402/svm/exact/server";

const MAINNET_EVM_NETWORK = "eip155:8453" as Network;
const MAINNET_SOLANA_NETWORK =
	"solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp" as Network;
const TESTNET_EVM_NETWORK = "eip155:84532" as Network;
const TESTNET_SOLANA_NETWORK =
	"solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as Network;
const MAINNET_SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
const TESTNET_SOLANA_RPC_URL = "https://api.devnet.solana.com";

const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const SOLANA_ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

type X402Environment = "production" | "development";

type X402Config = {
	environment: X402Environment;
	facilitatorUrl: string;
	facilitatorAuthToken?: string;
	evmNetwork: Network;
	solanaNetwork: Network;
	evmPayTo: string;
	solanaPayTo: string;
	solanaRpcUrl: string;
};

let x402ServerPromise: Promise<x402HTTPResourceServer> | undefined;

function isEnabled() {
	return process.env.X402_ENABLED === "true";
}

function getEnvironment(): X402Environment {
	return process.env.X402_ENVIRONMENT === "production" ||
		(process.env.X402_ENVIRONMENT === undefined &&
			process.env.NODE_ENV === "production")
		? "production"
		: "development";
}

function requiredEnv(name: string) {
	const value = process.env[name]?.trim();
	if (!value)
		throw new Error(`Missing required x402 environment variable: ${name}`);
	return value;
}

function getConfig(): X402Config {
	const environment = getEnvironment();
	const production = environment === "production";
	const facilitatorUrl = requiredEnv("X402_FACILITATOR_URL");
	const evmPayTo = requiredEnv("X402_EVM_PAY_TO");
	const solanaPayTo = requiredEnv("X402_SOLANA_PAY_TO");

	if (!EVM_ADDRESS_PATTERN.test(evmPayTo)) {
		throw new Error("X402_EVM_PAY_TO must be a valid EVM address");
	}
	if (!SOLANA_ADDRESS_PATTERN.test(solanaPayTo)) {
		throw new Error("X402_SOLANA_PAY_TO must be a valid Solana address");
	}
	if (production && /x402\.org\/facilitator/i.test(facilitatorUrl)) {
		throw new Error(
			"x402.org/facilitator is testnet-only; configure a production facilitator",
		);
	}

	return {
		environment,
		facilitatorUrl,
		facilitatorAuthToken:
			process.env.X402_FACILITATOR_AUTH_TOKEN?.trim() || undefined,
		evmNetwork: production ? MAINNET_EVM_NETWORK : TESTNET_EVM_NETWORK,
		solanaNetwork: production ? MAINNET_SOLANA_NETWORK : TESTNET_SOLANA_NETWORK,
		evmPayTo,
		solanaPayTo,
		solanaRpcUrl:
			process.env.X402_SOLANA_RPC_URL?.trim() ||
			(production ? MAINNET_SOLANA_RPC_URL : TESTNET_SOLANA_RPC_URL),
	};
}

function paymentOptions(config: X402Config, price: string): PaymentOption[] {
	return [
		{
			scheme: "exact",
			network: config.evmNetwork,
			payTo: config.evmPayTo,
			price,
			maxTimeoutSeconds: 300,
		},
		{
			scheme: "exact",
			network: config.solanaNetwork,
			payTo: config.solanaPayTo,
			price,
			maxTimeoutSeconds: 300,
		},
	];
}

function paidRoute(
	config: X402Config,
	price: string,
	description: string,
): RouteConfig {
	return {
		accepts: paymentOptions(config, price),
		description,
		mimeType: "application/json",
		serviceName: "mextdir",
		tags: ["mextdir", "school-data", "ai-agent"],
		unpaidResponseBody: () => ({
			contentType: "application/json",
			body: {
				error: "payment_required",
				message: "This API resource requires an x402 payment.",
			},
		}),
	};
}

function createRoutes(config: X402Config): Record<string, RouteConfig> {
	return {
		"GET /api/schools": paidRoute(
			config,
			"$10",
			"Search mextdir school listings",
		),
		"GET /api/schools/*": paidRoute(
			config,
			"$5",
			"Read one mextdir school listing",
		),
		"GET /api/*": paidRoute(config, "$3", "Access the mextdir JSON API"),
	};
}

function createFacilitator(config: X402Config) {
	const authToken = config.facilitatorAuthToken;
	return new HTTPFacilitatorClient({
		url: config.facilitatorUrl,
		createAuthHeaders: authToken
			? async () => {
					const headers = { Authorization: `Bearer ${authToken}` };
					return { verify: headers, settle: headers, supported: headers };
				}
			: undefined,
	});
}

async function createX402Server() {
	const config = getConfig();
	const resourceServer = new x402ResourceServer(createFacilitator(config))
		.register(config.evmNetwork, new ExactEvmScheme())
		.register(
			config.solanaNetwork,
			new ExactSvmScheme({ rpcUrl: config.solanaRpcUrl }),
		);
	const httpServer = new x402HTTPResourceServer(
		resourceServer,
		createRoutes(config),
	);
	await httpServer.initialize();
	return httpServer;
}

function getX402Server() {
	return (x402ServerPromise ??= createX402Server());
}

function isBrowserRequest(event: H3Event) {
	const client = (
		getRequestHeader(event, "x-mextdir-client") || ""
	).toLowerCase();
	if (client === "agent") return false;
	if (client === "browser") return true;
	return /mozilla|chrome|safari|firefox|edg\//i.test(
		getRequestHeader(event, "user-agent") || "",
	);
}

function createAdapter(event: H3Event, url: URL): HTTPAdapter {
	return {
		getHeader: (name) => getRequestHeader(event, name),
		getMethod: () => getMethod(event),
		getPath: () => url.pathname,
		getUrl: () => url.toString(),
		getAcceptHeader: () => getRequestHeader(event, "accept") || "",
		getUserAgent: () => getRequestHeader(event, "user-agent") || "",
		getQueryParams: () => Object.fromEntries(url.searchParams.entries()),
		getQueryParam: (name) => {
			const values = url.searchParams.getAll(name);
			return values.length > 1 ? values : values[0];
		},
	};
}

function createRequestContext(event: H3Event): HTTPRequestContext {
	const url = getRequestURL(event);
	const adapter = createAdapter(event, url);
	return {
		adapter,
		path: url.pathname,
		method: getMethod(event),
		paymentHeader: getRequestHeader(event, "payment-signature"),
	};
}

function responseBodyBuffer(body: unknown) {
	return Buffer.from(
		typeof body === "string" ? body : JSON.stringify(body ?? null),
	);
}

function applyResponse(
	event: H3Event,
	response: { status: number; headers: Record<string, string>; body?: unknown },
) {
	setResponseStatus(event, response.status);
	setResponseHeaders(event, response.headers);
	return response.body;
}

export async function withX402Payment(
	event: H3Event,
	handler: () => unknown | Promise<unknown>,
) {
	if (!isEnabled() || isBrowserRequest(event)) return handler();

	const httpServer = await getX402Server();
	const context = createRequestContext(event);
	const result = await httpServer.processHTTPRequest(context);

	if (result.type === "no-payment-required") return handler();
	if (result.type === "payment-error")
		return applyResponse(event, result.response);

	let body: unknown;
	try {
		body = await handler();
	} catch (error) {
		await result.cancellationDispatcher.cancel({
			reason: "handler_threw",
			error,
		});
		throw error;
	}

	const settlement = await httpServer.processSettlement(
		result.paymentPayload,
		result.paymentRequirements,
		result.declaredExtensions,
		{
			request: context,
			responseBody: responseBodyBuffer(body),
			responseHeaders: { "content-type": "application/json" },
		},
	);

	if (!settlement.success) return applyResponse(event, settlement.response);
	setResponseHeaders(event, settlement.headers);
	return body;
}
