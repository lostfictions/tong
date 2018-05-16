import { Collection } from "immutable";

/**
 * Escape special characters that would cause errors if we interpolated them
 * into a regex.
 * @param expression The string to escape.
 * @returns The escaped string, usable in a regular expression constructor.
 */
export function escapeForRegex(expression: string): string {
  return expression.replace(/[\\^$*+?.()|[\]{}]/g, "\\$&");
}

/** Returns a random number between min (inclusive) and max (exclusive). */
/* tslint:disable:no-parameter-reassignment */
export function randomInt(max: number): number;
export function randomInt(min: number, max: number): number;
export function randomInt(min: number, max?: number): number {
  if (typeof max === "undefined") {
    max = min;
    min = 0;
  }
  if (max < min) {
    [min, max] = [max, min];
  }
  return Math.floor(Math.random() * (max - min)) + min;
}
/* tslint:enable:no-parameter-reassignment */

export function randomInArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function randomInRange<T>(collection: Collection.Indexed<T>): T {
  return collection.get(Math.floor(Math.random() * collection.size));
}

// TODO: handle empty objects, zero weights
export interface WeightedValues {
  [value: string]: number;
}
export function randomByWeight<T extends WeightedValues, K extends keyof T>(
  weights: T
): K {
  const keys = Object.keys(weights) as K[];
  const sum = Object.values(weights).reduce((p, c) => {
    if (c < 0) throw new Error("Negative weight!");
    return p + c;
  }, 0);
  if (sum === 0) throw new Error("Weights add up to zero!");
  const choose = Math.floor(Math.random() * sum);
  for (let i = 0, count = 0; i < keys.length; i++) {
    count += weights[keys[i]];
    if (count > choose) {
      return keys[i];
    }
  }
  throw new Error("We goofed!");
}
