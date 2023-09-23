import { Command, Disposable, Event, Memento, OutputChannel, SourceControl, SourceControlInputBox, SourceControlInputBoxValidation, SourceControlResourceDecorations, SourceControlResourceGroup, SourceControlResourceState, ThemeColor, Uri, FileDecoration } from 'vscode';
import { Branch, Change, ForcePushMode, LogOptions, Ref, Remote, Status, CommitOptions, BranchQuery, FetchOptions } from './api/git';
import { Commit, Repository as BaseRepository, Stash, Submodule, LogFileOptions } from './git';
import { IRemoteSourceProviderRegistry } from './remoteProvider';
import { IPushErrorHandlerRegistry } from './pushError';
export declare const enum RepositoryState {
    Idle = 0,
    Disposed = 1
}
export declare const enum ResourceGroupType {
    Merge = 0,
    Index = 1,
    WorkingTree = 2,
    Untracked = 3
}
export declare class Resource implements SourceControlResourceState {
    private _commandResolver;
    private _resourceGroupType;
    private _resourceUri;
    private _type;
    private _useIcons;
    private _renameResourceUri?;
    static getStatusText(type: Status): any;
    get resourceUri(): Uri;
    get leftUri(): Uri | undefined;
    get rightUri(): Uri | undefined;
    get command(): Command;
    private get resources();
    get resourceGroupType(): ResourceGroupType;
    get type(): Status;
    get original(): Uri;
    get renameResourceUri(): Uri | undefined;
    private static Icons;
    private getIconPath;
    private get tooltip();
    private get strikeThrough();
    private get faded();
    get decorations(): SourceControlResourceDecorations;
    get letter(): string;
    get color(): ThemeColor;
    get priority(): number;
    get resourceDecoration(): FileDecoration;
    constructor(_commandResolver: ResourceCommandResolver, _resourceGroupType: ResourceGroupType, _resourceUri: Uri, _type: Status, _useIcons: boolean, _renameResourceUri?: Uri);
    open(): Promise<void>;
    openFile(): Promise<void>;
    openChange(): Promise<void>;
}
export declare const enum Operation {
    Status = "Status",
    Config = "Config",
    Diff = "Diff",
    MergeBase = "MergeBase",
    Add = "Add",
    Remove = "Remove",
    RevertFiles = "RevertFiles",
    Commit = "Commit",
    Clean = "Clean",
    Branch = "Branch",
    GetBranch = "GetBranch",
    GetBranches = "GetBranches",
    SetBranchUpstream = "SetBranchUpstream",
    HashObject = "HashObject",
    Checkout = "Checkout",
    CheckoutTracking = "CheckoutTracking",
    Reset = "Reset",
    Remote = "Remote",
    Fetch = "Fetch",
    Pull = "Pull",
    Push = "Push",
    CherryPick = "CherryPick",
    Sync = "Sync",
    Show = "Show",
    Stage = "Stage",
    GetCommitTemplate = "GetCommitTemplate",
    DeleteBranch = "DeleteBranch",
    RenameBranch = "RenameBranch",
    DeleteRef = "DeleteRef",
    Merge = "Merge",
    Rebase = "Rebase",
    Ignore = "Ignore",
    Tag = "Tag",
    DeleteTag = "DeleteTag",
    Stash = "Stash",
    CheckIgnore = "CheckIgnore",
    GetObjectDetails = "GetObjectDetails",
    SubmoduleUpdate = "SubmoduleUpdate",
    RebaseAbort = "RebaseAbort",
    RebaseContinue = "RebaseContinue",
    FindTrackingBranches = "GetTracking",
    Apply = "Apply",
    Blame = "Blame",
    Log = "Log",
    LogFile = "LogFile",
    Move = "Move"
}
export interface Operations {
    isIdle(): boolean;
    shouldShowProgress(): boolean;
    isRunning(operation: Operation): boolean;
}
export interface GitResourceGroup extends SourceControlResourceGroup {
    resourceStates: Resource[];
}
export interface OperationResult {
    operation: Operation;
    error: any;
}
declare class ResourceCommandResolver {
    private repository;
    constructor(repository: Repository);
    resolveDefaultCommand(resource: Resource): Command;
    resolveFileCommand(resource: Resource): Command;
    resolveChangeCommand(resource: Resource): Command;
    getResources(resource: Resource): [Uri | undefined, Uri | undefined];
    private getLeftResource;
    private getRightResource;
    private getTitle;
}
export declare class Repository implements Disposable {
    private readonly repository;
    private pushErrorHandlerRegistry;
    private _onDidChangeRepository;
    readonly onDidChangeRepository: Event<Uri>;
    private _onDidChangeState;
    readonly onDidChangeState: Event<RepositoryState>;
    private _onDidChangeStatus;
    readonly onDidRunGitStatus: Event<void>;
    private _onDidChangeOriginalResource;
    readonly onDidChangeOriginalResource: Event<Uri>;
    private _onRunOperation;
    readonly onRunOperation: Event<Operation>;
    private _onDidRunOperation;
    readonly onDidRunOperation: Event<OperationResult>;
    get onDidChangeOperations(): Event<void>;
    private _sourceControl;
    get sourceControl(): SourceControl;
    get inputBox(): SourceControlInputBox;
    private _mergeGroup;
    get mergeGroup(): GitResourceGroup;
    private _indexGroup;
    get indexGroup(): GitResourceGroup;
    private _workingTreeGroup;
    get workingTreeGroup(): GitResourceGroup;
    private _untrackedGroup;
    get untrackedGroup(): GitResourceGroup;
    private _HEAD;
    get HEAD(): Branch | undefined;
    private _refs;
    get refs(): Ref[];
    get headShortName(): string | undefined;
    private _remotes;
    get remotes(): Remote[];
    private _submodules;
    get submodules(): Submodule[];
    private _rebaseCommit;
    set rebaseCommit(rebaseCommit: Commit | undefined);
    get rebaseCommit(): Commit | undefined;
    private _operations;
    get operations(): Operations;
    private _state;
    get state(): RepositoryState;
    set state(state: RepositoryState);
    get root(): string;
    get dotGit(): string;
    private isRepositoryHuge;
    private didWarnAboutLimit;
    private resourceCommandResolver;
    private disposables;
    constructor(repository: BaseRepository, remoteSourceProviderRegistry: IRemoteSourceProviderRegistry, pushErrorHandlerRegistry: IPushErrorHandlerRegistry, globalState: Memento, outputChannel: OutputChannel);
    validateInput(text: string, position: number): SourceControlInputBoxValidation | undefined;
    provideOriginalResource(uri: Uri): Uri | undefined;
    getInputTemplate(): Promise<string>;
    getConfigs(): Promise<{
        key: string;
        value: string;
    }[]>;
    getConfig(key: string): Promise<string>;
    getGlobalConfig(key: string): Promise<string>;
    setConfig(key: string, value: string): Promise<string>;
    log(options?: LogOptions): Promise<Commit[]>;
    logFile(uri: Uri, options?: LogFileOptions): Promise<Commit[]>;
    status(): Promise<void>;
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
    getMergeBase(ref1: string, ref2: string): Promise<string>;
    hashObject(data: string): Promise<string>;
    add(resources: Uri[], opts?: {
        update?: boolean;
    }): Promise<void>;
    rm(resources: Uri[]): Promise<void>;
    stage(resource: Uri, contents: string): Promise<void>;
    revert(resources: Uri[]): Promise<void>;
    commit(message: string | undefined, opts?: CommitOptions): Promise<void>;
    clean(resources: Uri[]): Promise<void>;
    branch(name: string, _checkout: boolean, _ref?: string): Promise<void>;
    deleteBranch(name: string, force?: boolean): Promise<void>;
    renameBranch(name: string): Promise<void>;
    cherryPick(commitHash: string): Promise<void>;
    move(from: string, to: string): Promise<void>;
    getBranch(name: string): Promise<Branch>;
    getBranches(query: BranchQuery): Promise<Ref[]>;
    setBranchUpstream(name: string, upstream: string): Promise<void>;
    merge(ref: string): Promise<void>;
    rebase(branch: string): Promise<void>;
    tag(name: string, message?: string): Promise<void>;
    deleteTag(name: string): Promise<void>;
    checkout(treeish: string, opts?: {
        detached?: boolean;
    }): Promise<void>;
    checkoutTracking(treeish: string, opts?: {
        detached?: boolean;
    }): Promise<void>;
    findTrackingBranches(upstreamRef: string): Promise<Branch[]>;
    getCommit(ref: string): Promise<Commit>;
    reset(treeish: string, hard?: boolean): Promise<void>;
    deleteRef(ref: string): Promise<void>;
    addRemote(name: string, url: string): Promise<void>;
    removeRemote(name: string): Promise<void>;
    renameRemote(name: string, newName: string): Promise<void>;
    fetchDefault(options?: {
        silent?: boolean;
    }): Promise<void>;
    fetchPrune(): Promise<void>;
    fetchAll(): Promise<void>;
    fetch(options: FetchOptions): Promise<void>;
    private _fetch;
    pullWithRebase(head: Branch | undefined): Promise<void>;
    pull(head?: Branch, unshallow?: boolean): Promise<void>;
    pullFrom(rebase?: boolean, remote?: string, branch?: string, unshallow?: boolean): Promise<void>;
    push(head: Branch, forcePushMode?: ForcePushMode): Promise<void>;
    pushTo(remote?: string, name?: string, setUpstream?: boolean, forcePushMode?: ForcePushMode): Promise<void>;
    pushFollowTags(remote?: string, forcePushMode?: ForcePushMode): Promise<void>;
    pushTags(remote?: string, forcePushMode?: ForcePushMode): Promise<void>;
    blame(path: string): Promise<string>;
    sync(head: Branch): Promise<void>;
    syncRebase(head: Branch): Promise<void>;
    private _sync;
    private checkIfMaybeRebased;
    show(ref: string, filePath: string): Promise<string>;
    buffer(ref: string, filePath: string): Promise<Buffer>;
    getObjectDetails(ref: string, filePath: string): Promise<{
        mode: string;
        object: string;
        size: number;
    }>;
    detectObjectType(object: string): Promise<{
        mimetype: string;
        encoding?: string;
    }>;
    apply(patch: string, reverse?: boolean): Promise<void>;
    getStashes(): Promise<Stash[]>;
    createStash(message?: string, includeUntracked?: boolean): Promise<void>;
    popStash(index?: number): Promise<void>;
    dropStash(index?: number): Promise<void>;
    applyStash(index?: number): Promise<void>;
    getCommitTemplate(): Promise<string>;
    ignore(files: Uri[]): Promise<void>;
    rebaseAbort(): Promise<void>;
    checkIgnore(filePaths: string[]): Promise<Set<string>>;
    private parseIgnoreCheck;
    private _push;
    private run;
    private retryRun;
    private static KnownHugeFolderNames;
    private findKnownHugeFolderPathsToIgnore;
    private updateModelState;
    private setCountBadge;
    private getRebaseCommit;
    private maybeAutoStash;
    private onFileChange;
    private eventuallyUpdateWhenIdleAndWait;
    private updateWhenIdleAndWait;
    whenIdleAndFocused(): Promise<void>;
    get headLabel(): string;
    get syncLabel(): string;
    get syncTooltip(): string;
    private updateInputBoxPlaceholder;
    dispose(): void;
}
export {};
