import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";

export const envSchema = z.object({
	ENVIRONMENT: z
		.string()
		.default("testnet")
		.transform((value) => value.toLowerCase()),
	PRIVATE_KEY_EXECUTOR: z
		.string()
		.min(1, "Wallet Private Key is required")
		.refine((key) => /^(0x)?[a-fA-F0-9]{64}$/.test(key.trim()), {
			message:
				"Wallet private key must be a 64-character hexadecimal string (32 bytes)",
		}),
	PRICER_URL: z.string().min(1, "Pricer API URL is required"),
	ENABLED_NETWORKS: z
		.string()
		.min(1, "At least one network must be enabled"),
});

export type Config = z.infer<typeof envSchema>;

export async function validateConfig(
	runtime: IAgentRuntime,
): Promise<Config> {
	try {
		const config = {
			ENVIRONMENT: runtime.getSetting("ENVIRONMENT"),
			PRIVATE_KEY_EXECUTOR: runtime.getSetting("PRIVATE_KEY_EXECUTOR"),
			PRICER_URL: runtime.getSetting("PRICER_URL"),
			ENABLED_NETWORKS: runtime.getSetting("ENABLED_NETWORKS"),
		};

		return envSchema.parse(config);
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.errors
				.map((err) => `${err.path.join(".")}: ${err.message}`)
				.join("\n");
			throw new Error(
				`Configuration validation failed:\n${errorMessages}`,
			);
		}
		throw error;
	}
}
