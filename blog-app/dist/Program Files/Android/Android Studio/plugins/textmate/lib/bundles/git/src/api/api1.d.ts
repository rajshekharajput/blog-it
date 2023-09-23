import { Model } from '../model';
import { Repository as BaseRepository, Resource } from '../repository';
import { InputBox, Git, API, Repository, Remote, RepositoryState, Branch, ForcePushMode, Ref, Submodule, Commit, Change, RepositoryUIState, Status, LogOptions, APIState, CommitOptions, RemoteSourceProvider, CredentialsProvider, BranchQuery, PushErrorHandler, PublishEvent, FetchOptions } from './git';
import { Event, Uri, SourceControl, Disposable } from 'vscode';
import { GitExtensionImpl } from './extension';
export declare class ApiChange implements Change {
    private readonly resource;
    get uri(): Uri;
    get originalUri(): Uri;
    get renameUri(): Uri | undefined;
    get status(): Status;
    constructor(resource: Resource);
}
export declare class ApiRepositoryState implements RepositoryState {
    private _repository;
    get HEAD(): Branch | undefined;
    get refs(): Ref[];
    get remotes(): Remote[];
    get submodules(): Submodule[];
    get rebaseCommit(): Commit | undefined;
    get mergeChanges(): Change[];
    get indexChanges(): Change[];
    get workingTreeChanges(): Change[];
    readonly onDidChange: Event<void>;
    constructor(_repository: BaseRepository);
}
export declare class ApiRepositoryUIState implements RepositoryUIState {
    private _sourceControl;
    get selected(): boolean;
    readonly onDidChange: Event<void>;
    constructor(_sourceControl: SourceControl);
}
export declare class ApiRepository implements Repository {
    private _repository;
    readonly rootUri: Uri;
    readonly inputBox: InputBox;
    readonly state: RepositoryState;
    readonly ui: RepositoryUIState;
    constructor(_repository: BaseRepository);
    apply(patch: string, reverse?: boolean): Promise<void>;
    getConfigs(): Promise<{
        key: string;
        value: string;
    }[]>;
    getConfig(key: string): Promise<string>;
    setConfig(key: string, value: string): Promise<string>;
    getGlobalConfig(key: string): Promise<string>;
    getObjectDetails(treeish: string, path: string): Promise<{
        mode: string;
        object: string;
        size: number;
    }>;
    detectObjectType(object: string): Promise<{
        mimetype: string;
        encoding?: string;
    }>;
    buffer(ref: string, filePath: string): Promise<Buffer>;
    show(ref: string, path: string): Promise<string>;
    getCommit(ref: string): Promise<Commit>;
    clean(paths: string[]): Promise<void>;
    diff(cached?: boolean): Promise<string>;
    diffWithHEAD(): Promise<Change[]>;
    diffWithHEAD(path: string): Promise<string>;
    diffWith(ref: string): Promise<Change[]>;
    diffWith(ref: string, path: string): Promise<string>;
    diffIndexWithHEAD(): Promise<Change[]>;
    diffIndexWithHEAD(path: string): Promise<string>;
    diffIndexWith(ref: string): Promise<Change[]>;
    diffIndexWith(ref: string, path: string): Promise<string>;
    diffBlobs(object1: string, object2: string): Promise<string>;
    diffBetween(ref1: string, ref2: string): Promise<Change[]>;
    diffBetween(ref1: string, ref2: string, path: string): Promise<string>;
    hashObject(data: string): Promise<string>;
    createBranch(name: string, checkout: boolean, ref?: string | undefined): Promise<void>;
    deleteBranch(name: string, force?: boolean): Promise<void>;
    getBranch(name: string): Promise<Branch>;
    getBranches(query: BranchQuery): Promise<Ref[]>;
    setBranchUpstream(name: string, upstream: string): Promise<void>;
    getMergeBase(ref1: string, ref2: string): Promise<string>;
    status(): Promise<void>;
    checkout(treeish: string): Promise<void>;
    addRemote(name: string, url: string): Promise<void>;
    removeRemote(name: string): Promise<void>;
    renameRemote(name: string, newName: string): Promise<void>;
    fetch(arg0?: FetchOptions | string | undefined, ref?: string | undefined, depth?: number | undefined, prune?: boolean | undefined): Promise<void>;
    pull(unshallow?: boolean): Promise<void>;
    push(remoteName?: string, branchName?: string, setUpstream?: boolean, force?: ForcePushMode): Promise<void>;
    blame(path: string): Promise<string>;
    log(options?: LogOptions): Promise<Commit[]>;
    commit(message: string, opts?: CommitOptions): Promise<void>;
}
export declare class ApiGit implements Git {
    private _model;
    get path(): string;
    constructor(_model: Model);
}
export declare class ApiImpl implements API {
    private _model;
    readonly git: ApiGit;
    get state(): APIState;
    get onDidChangeState(): Event<APIState>;
    get onDidPublish(): Event<PublishEvent>;
    get onDidOpenRepository(): Event<Repository>;
    get onDidCloseRepository(): Event<Repository>;
    get repositories(): Repository[];
    toGitUri(uri: Uri, ref: string): Uri;
    getRepository(uri: Uri): Repository | null;
    init(root: Uri): Promise<Repository | null>;
    openRepository(root: Uri): Promise<Repository | null>;
    registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable;
    registerCredentialsProvider(provider: CredentialsProvider): Disposable;
    registerPushErrorHandler(handler: PushErrorHandler): Disposable;
    constructor(_model: Model);
}
export declare function registerAPICommands(extension: GitExtensionImpl): Disposable;
