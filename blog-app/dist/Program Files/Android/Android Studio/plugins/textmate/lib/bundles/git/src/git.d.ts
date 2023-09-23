/// <reference types="node" />
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import { CancellationToken, Progress, Uri } from 'vscode';
import { Ref, Branch, Remote, ForcePushMode, LogOptions, Change, CommitOptions, BranchQuery } from './api/git';
export interface IGit {
    path: string;
    version: string;
}
export interface IFileStatus {
    x: string;
    y: string;
    path: string;
    rename?: string;
}
export interface Stash {
    index: number;
    description: string;
}
export interface LogFileOptions {
    readonly maxEntries?: number | string;
    readonly hash?: string;
    readonly reverse?: boolean;
    readonly sortByAuthorDate?: boolean;
}
export declare function findGit(hint: string | string[] | undefined, onLookup: (path: string) => void): Promise<IGit>;
export interface IExecutionResult<T extends string | Buffer> {
    exitCode: number;
    stdout: T;
    stderr: string;
}
export interface SpawnOptions extends cp.SpawnOptions {
    input?: string;
    encoding?: string;
    log?: boolean;
    cancellationToken?: CancellationToken;
    onSpawn?: (childProcess: cp.ChildProcess) => void;
}
export interface IGitErrorData {
    error?: Error;
    message?: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    gitErrorCode?: string;
    gitCommand?: string;
    gitArgs?: string[];
}
export declare class GitError {
    error?: Error;
    message: string;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    gitErrorCode?: string;
    gitCommand?: string;
    gitArgs?: string[];
    constructor(data: IGitErrorData);
    toString(): string;
}
export interface IGitOptions {
    gitPath: string;
    userAgent: string;
    version: string;
    env?: any;
}
export interface ICloneOptions {
    readonly parentPath: string;
    readonly progress: Progress<{
        increment: number;
    }>;
    readonly recursive?: boolean;
}
export declare class Git {
    readonly path: string;
    readonly userAgent: string;
    readonly version: string;
    private env;
    private _onOutput;
    get onOutput(): EventEmitter;
    constructor(options: IGitOptions);
    compareGitVersionTo(version: string): -1 | 0 | 1;
    open(repository: string, dotGit: string): Repository;
    init(repository: string): Promise<void>;
    clone(url: string, options: ICloneOptions, cancellationToken?: CancellationToken): Promise<string>;
    getRepositoryRoot(repositoryPath: string): Promise<string>;
    getRepositoryDotGit(repositoryPath: string): Promise<string>;
    exec(cwd: string, args: string[], options?: SpawnOptions): Promise<IExecutionResult<string>>;
    exec2(args: string[], options?: SpawnOptions): Promise<IExecutionResult<string>>;
    stream(cwd: string, args: string[], options?: SpawnOptions): cp.ChildProcess;
    private _exec;
    spawn(args: string[], options?: SpawnOptions): cp.ChildProcess;
    private log;
}
export interface Commit {
    hash: string;
    message: string;
    parents: string[];
    authorDate?: Date;
    authorName?: string;
    authorEmail?: string;
    commitDate?: Date;
}
export declare class GitStatusParser {
    private lastRaw;
    private result;
    get status(): IFileStatus[];
    update(raw: string): void;
    private parseEntry;
}
export interface Submodule {
    name: string;
    path: string;
    url: string;
}
export declare function parseGitmodules(raw: string): Submodule[];
export declare function parseGitCommits(data: string): Commit[];
interface LsTreeElement {
    mode: string;
    type: string;
    object: string;
    size: string;
    file: string;
}
export declare function parseLsTree(raw: string): LsTreeElement[];
interface LsFilesElement {
    mode: string;
    object: string;
    stage: string;
    file: string;
}
export declare function parseLsFiles(raw: string): LsFilesElement[];
export interface PullOptions {
    unshallow?: boolean;
    tags?: boolean;
    readonly cancellationToken?: CancellationToken;
}
export declare class Repository {
    private _git;
    private repositoryRoot;
    readonly dotGit: string;
    constructor(_git: Git, repositoryRoot: string, dotGit: string);
    get git(): Git;
    get root(): string;
    exec(args: string[], options?: SpawnOptions): Promise<IExecutionResult<string>>;
    stream(args: string[], options?: SpawnOptions): cp.ChildProcess;
    spawn(args: string[], options?: SpawnOptions): cp.ChildProcess;
    config(scope: string, key: string, value?: any, options?: SpawnOptions): Promise<string>;
    getConfigs(scope: string): Promise<{
        key: string;
        value: string;
    }[]>;
    log(options?: LogOptions): Promise<Commit[]>;
    logFile(uri: Uri, options?: LogFileOptions): Promise<Commit[]>;
    bufferString(object: string, encoding?: string, autoGuessEncoding?: boolean): Promise<string>;
    buffer(object: string): Promise<Buffer>;
    getObjectDetails(treeish: string, path: string): Promise<{
        mode: string;
        object: string;
        size: number;
    }>;
    lstree(treeish: string, path: string): Promise<LsTreeElement[]>;
    lsfiles(path: string): Promise<LsFilesElement[]>;
    getGitRelativePath(ref: string, relativePath: string): Promise<string>;
    detectObjectType(object: string): Promise<{
        mimetype: string;
        encoding?: string;
    }>;
    apply(patch: string, reverse?: boolean): Promise<void>;
    diff(cached?: boolean): Promise<string>;
    diffWithHEAD(): Promise<Change[]>;
    diffWithHEAD(path: string): Promise<string>;
    diffWithHEAD(path?: string | undefined): Promise<string | Change[]>;
    diffWith(ref: string): Promise<Change[]>;
    diffWith(ref: string, path: string): Promise<string>;
    diffWith(ref: string, path?: string | undefined): Promise<string | Change[]>;
    diffIndexWithHEAD(): Promise<Change[]>;
    diffIndexWithHEAD(path: string): Promise<string>;
    diffIndexWithHEAD(path?: string | undefined): Promise<string | Change[]>;
    diffIndexWith(ref: string): Promise<Change[]>;
    diffIndexWith(ref: string, path: string): Promise<string>;
    diffIndexWith(ref: string, path?: string | undefined): Promise<string | Change[]>;
    diffBlobs(object1: string, object2: string): Promise<string>;
    diffBetween(ref1: string, ref2: string): Promise<Change[]>;
    diffBetween(ref1: string, ref2: string, path: string): Promise<string>;
    diffBetween(ref1: string, ref2: string, path?: string | undefined): Promise<string | Change[]>;
    private diffFiles;
    getMergeBase(ref1: string, ref2: string): Promise<string>;
    hashObject(data: string): Promise<string>;
    add(paths: string[], opts?: {
        update?: boolean;
    }): Promise<void>;
    rm(paths: string[]): Promise<void>;
    stage(path: string, data: string): Promise<void>;
    checkout(treeish: string, paths: string[], opts?: {
        track?: boolean;
        detached?: boolean;
    }): Promise<void>;
    commit(message: string | undefined, opts?: CommitOptions): Promise<void>;
    rebaseAbort(): Promise<void>;
    rebaseContinue(): Promise<void>;
    private handleCommitError;
    branch(name: string, checkout: boolean, ref?: string): Promise<void>;
    deleteBranch(name: string, force?: boolean): Promise<void>;
    renameBranch(name: string): Promise<void>;
    move(from: string, to: string): Promise<void>;
    setBranchUpstream(name: string, upstream: string): Promise<void>;
    deleteRef(ref: string): Promise<void>;
    merge(ref: string): Promise<void>;
    tag(name: string, message?: string): Promise<void>;
    deleteTag(name: string): Promise<void>;
    clean(paths: string[]): Promise<void>;
    undo(): Promise<void>;
    reset(treeish: string, hard?: boolean): Promise<void>;
    revert(treeish: string, paths: string[]): Promise<void>;
    addRemote(name: string, url: string): Promise<void>;
    removeRemote(name: string): Promise<void>;
    renameRemote(name: string, newName: string): Promise<void>;
    fetch(options?: {
        remote?: string;
        ref?: string;
        all?: boolean;
        prune?: boolean;
        depth?: number;
        silent?: boolean;
        readonly cancellationToken?: CancellationToken;
    }): Promise<void>;
    pull(rebase?: boolean, remote?: string, branch?: string, options?: PullOptions): Promise<void>;
    rebase(branch: string, options?: PullOptions): Promise<void>;
    push(remote?: string, name?: string, setUpstream?: boolean, followTags?: boolean, forcePushMode?: ForcePushMode, tags?: boolean): Promise<void>;
    cherryPick(commitHash: string): Promise<void>;
    blame(path: string): Promise<string>;
    createStash(message?: string, includeUntracked?: boolean): Promise<void>;
    popStash(index?: number): Promise<void>;
    applyStash(index?: number): Promise<void>;
    private popOrApplyStash;
    dropStash(index?: number): Promise<void>;
    getStatus(opts?: {
        limit?: number;
        ignoreSubmodules?: boolean;
    }): Promise<{
        status: IFileStatus[];
        didHitLimit: boolean;
    }>;
    getHEAD(): Promise<Ref>;
    findTrackingBranches(upstreamBranch: string): Promise<Branch[]>;
    getRefs(opts?: {
        sort?: 'alphabetically' | 'committerdate';
        contains?: string;
        pattern?: string;
        count?: number;
    }): Promise<Ref[]>;
    getStashes(): Promise<Stash[]>;
    getRemotes(): Promise<Remote[]>;
    getBranch(name: string): Promise<Branch>;
    getBranches(query: BranchQuery): Promise<Ref[]>;
    stripCommitMessageComments(message: string): string;
    getSquashMessage(): Promise<string | undefined>;
    getMergeMessage(): Promise<string | undefined>;
    getCommitTemplate(): Promise<string>;
    getCommit(ref: string): Promise<Commit>;
    updateSubmodules(paths: string[]): Promise<void>;
    getSubmodules(): Promise<Submodule[]>;
}
export {};
