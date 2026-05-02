import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

const algorithm = "scrypt";
const keyLength = 32;
const scryptCost = 16384;
const scryptBlockSize = 8;
const scryptParallelization = 1;

function derivePinKey(pin: string, salt: Buffer, length: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(pin, salt, length, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });
}

function isScryptHash(value: string) {
  return value.startsWith(`${algorithm}:`);
}

export function isHashedPin(value: string) {
  return isScryptHash(value);
}

export async function hashPin(pin: string) {
  const salt = randomBytes(16);
  const derivedKey = await derivePinKey(pin, salt, keyLength, {
    N: scryptCost,
    r: scryptBlockSize,
    p: scryptParallelization,
  });

  return [
    algorithm,
    scryptCost,
    scryptBlockSize,
    scryptParallelization,
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join(":");
}

export async function verifyPin(inputPin: string, storedCredential: string) {
  if (!isScryptHash(storedCredential)) {
    const left = Buffer.from(inputPin);
    const right = Buffer.from(storedCredential);

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }

  const [storedAlgorithm, rawCost, rawBlockSize, rawParallelization, rawSalt, rawHash] =
    storedCredential.split(":");

  if (
    storedAlgorithm !== algorithm ||
    !rawCost ||
    !rawBlockSize ||
    !rawParallelization ||
    !rawSalt ||
    !rawHash
  ) {
    return false;
  }

  const cost = Number(rawCost);
  const blockSize = Number(rawBlockSize);
  const parallelization = Number(rawParallelization);

  if (
    !Number.isSafeInteger(cost) ||
    !Number.isSafeInteger(blockSize) ||
    !Number.isSafeInteger(parallelization)
  ) {
    return false;
  }

  const salt = Buffer.from(rawSalt, "base64url");
  const expectedHash = Buffer.from(rawHash, "base64url");
  const actualHash = await derivePinKey(inputPin, salt, expectedHash.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
  });

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(actualHash, expectedHash);
}
