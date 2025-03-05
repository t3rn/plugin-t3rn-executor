import { settings } from "@elizaos/core";
import { z } from "zod";

export const envSchema = z.object({
	ENVIRONMENT: z
		.string()
		.default("testnet")
		.transform((value) => value.toLowerCase()),
	LOG_PRETTY: z.coerce.boolean().default(true),
	LOG_LEVEL: z.string().default("debug"),
	APP_NAME: z.string().default("executor"),
	PRIVATE_KEY_EXECUTOR: z
		.string()
		.min(1, "Wallet Private Key is required")
		.refine((key) => /^(0x)?[a-fA-F0-9]{64}$/.test(key.trim()), {
			message:
				"Wallet private key must be a 64-character hexadecimal string (32 bytes)",
		}),
	PRICER_URL: z.string().min(1, "Pricer API URL is required").default('https://api.t1rn.io'),
	OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
	DISABLE_AI_EXECUTOR_AUTORUN: z.coerce.boolean().default(false),
	DISABLE_EXECUTOR_AUTORUN: z.coerce.boolean().default(true)
});

export type Config = z.infer<typeof envSchema>;

export function validateConfig(): Config {
	try {
		const config = {
			ENVIRONMENT: settings.ENVIRONMENT,
			LOG_PRETTY: settings.LOG_PRETTY,
			LOG_LEVEL: settings.LOG_LEVEL,
			APP_NAME: settings.APP_NAME,
			PRIVATE_KEY_EXECUTOR: settings.PRIVATE_KEY_EXECUTOR,
			PRICER_URL: settings.PRICER_URL,
			OPENAI_API_KEY: settings.OPENAI_API_KEY,
			DISABLE_AI_EXECUTOR_AUTORUN: settings.DISABLE_AI_EXECUTOR_AUTORUN,
			DISABLE_EXECUTOR_AUTORUN: settings.DISABLE_EXECUTOR_AUTORUN
		};

		return envSchema.parse(config);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.errors
				.map((err) => `${err.path.join(".")}: ${err.message}`)
				.join("\n");
			throw new Error(`Configuration validation failed:\n${errorMessages}`);
		}
		throw error;
	}
}
