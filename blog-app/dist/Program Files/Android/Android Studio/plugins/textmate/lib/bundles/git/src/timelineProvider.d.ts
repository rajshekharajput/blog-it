import { CancellationToken, Event, Timeline, TimelineChangeEvent, TimelineItem, TimelineOptions, TimelineProvider, Uri } from 'vscode';
import { Model } from './model';
import { CommandCenter } from './commands';
export declare class GitTimelineItem extends TimelineItem {
    static is(item: TimelineItem): item is GitTimelineItem;
    readonly ref: string;
    readonly previousRef: string;
    readonly message: string;
    constructor(ref: string, previousRef: string, message: string, timestamp: number, id: string, contextValue: string);
    get shortRef(): string;
    get shortPreviousRef(): string;
    private shortenRef;
}
export declare class GitTimelineProvider implements TimelineProvider {
    private readonly model;
    private commands;
    private _onDidChange;
    get onDidChange(): Event<TimelineChangeEvent | undefined>;
    readonly id = "git-history";
    readonly label: any;
    private readonly disposable;
    private providerDisposable;
    private repo;
    private repoDisposable;
    private repoStatusDate;
    constructor(model: Model, commands: CommandCenter);
    dispose(): void;
    provideTimeline(uri: Uri, options: TimelineOptions, _token: CancellationToken): Promise<Timeline>;
    private ensureProviderRegistration;
    private onConfigurationChanged;
    private onRepositoriesChanged;
    private onRepositoryChanged;
    private onRepositoryStatusChanged;
    private fireChanged;
}
