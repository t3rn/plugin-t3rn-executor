import { BigNumber } from "@ethersproject/bignumber";

export const convertBigNumbersToString = (obj: any): any => {
    if (typeof obj !== "object" || obj === null) return obj;

    if (obj._isBigNumber && obj._hex) {
        return BigNumber.from(obj._hex).toString();
    }

    if (Array.isArray(obj)) {
        return obj.map(convertBigNumbersToString);
    }

    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [key, convertBigNumbersToString(value)])
    );
};

export const deepClone = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(deepClone) as unknown as T;
    }
    const cloned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = deepClone((obj as any)[key]);
        }
    }
    return cloned as T;
}
