/// <reference types="node" />
import { Event } from 'vscode';
import { Readable } from 'stream';
export declare function log(...args: any[]): void;
export interface IDisposable {
    dispose(): void;
}
export declare function dispose<T extends IDisposable>(disposables: T[]): T[];
export declare function toDisposable(dispose: () => void): IDisposable;
export declare function combinedDisposable(disposables: IDisposable[]): IDisposable;
export declare const EmptyDisposable: IDisposable;
export declare function fireEvent<T>(event: Event<T>): Event<T>;
export declare function mapEvent<I, O>(event: Event<I>, map: (i: I) => O): Event<O>;
export declare function filterEvent<T>(event: Event<T>, filter: (e: T) => boolean): Event<T>;
export declare function anyEvent<T>(...events: Event<T>[]): Event<T>;
export declare function done<T>(promise: Promise<T>): Promise<void>;
export declare function onceEvent<T>(event: Event<T>): Event<T>;
export declare function debounceEvent<T>(event: Event<T>, delay: number): Event<T>;
export declare function eventToPromise<T>(event: Event<T>): Promise<T>;
export declare function once(fn: (...args: any[]) => any): (...args: any[]) => any;
export declare function assign<T>(destination: T, ...sources: any[]): T;
export declare function uniqBy<T>(arr: T[], fn: (el: T) => string): T[];
export declare function groupBy<T>(arr: T[], fn: (el: T) => string): {
    [key: string]: T[];
};
export declare function mkdirp(path: string, mode?: number): Promise<boolean>;
export declare function uniqueFilter<T>(keyFn: (t: T) => string): (t: T) => boolean;
export declare function find<T>(array: T[], fn: (t: T) => boolean): T | undefined;
export declare function grep(filename: string, pattern: RegExp): Promise<boolean>;
export declare function readBytes(stream: Readable, bytes: number): Promise<Buffer>;
export declare const enum Encoding {
    UTF8 = "utf8",
    UTF16be = "utf16be",
    UTF16le = "utf16le"
}
export declare function detectUnicodeEncoding(buffer: Buffer): Encoding | null;
export declare function isDescendant(parent: string, descendant: string): boolean;
export declare function pathEquals(a: string, b: string): boolean;
export declare function splitInChunks(array: string[], maxChunkLength: number): IterableIterator<string[]>;
export declare class Limiter<T> {
    private runningPromises;
    private maxDegreeOfParalellism;
    private outstandingPromises;
    constructor(maxDegreeOfParalellism: number);
    queue(factory: () => Promise<T>): Promise<T>;
    private consume;
    private consumed;
}
export declare class PromiseSource<T> {
    private _onDidComplete;
    private _promise;
    get promise(): Promise<T>;
    resolve(value: T): void;
    reject(err: any): void;
}
export declare namespace Versions {
    type VersionComparisonResult = -1 | 0 | 1;
    export interface Version {
        major: number;
        minor: number;
        patch: number;
        pre?: string;
    }
    export function compare(v1: string | Version, v2: string | Version): VersionComparisonResult;
    export function from(major: string | number, minor: string | number, patch?: string | number, pre?: string): Version;
    export function fromString(version: string): Version;
    export {};
}
