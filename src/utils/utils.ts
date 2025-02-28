import { elizaLogger } from "@elizaos/core";

/**
 * Sleep for a given number of seconds.
 *
 * @param {number}  seconds seconds to sleep for
 * @param {string=} reason reason for sleeping
 */
export function sleep(seconds: number, reason?: string): Promise<void> {
    elizaLogger.trace({ reason }, `Sleeping for ${seconds} sec...`)

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve()
        }, seconds * 1000)
    })
}