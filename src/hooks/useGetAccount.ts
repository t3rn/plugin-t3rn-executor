import { settings } from "@elizaos/core";
import { PrivateKeyAccount } from "viem/accounts";
import { privateKeyToAccount } from "viem/accounts";

export const useGetAccount = (): PrivateKeyAccount => {
	let PRIVATE_KEY = settings.PRIVATE_KEY_EXECUTOR
	if (!PRIVATE_KEY) {
		throw new Error("PRIVATE_KEY_EXECUTOR environment variable is not set");
	}

	// remove 0x from private key:
	PRIVATE_KEY = PRIVATE_KEY.replace(/^0x/, "");
	return privateKeyToAccount(`0x${PRIVATE_KEY}`);
};