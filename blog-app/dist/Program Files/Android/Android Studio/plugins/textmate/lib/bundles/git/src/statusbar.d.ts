import { Command, Event } from 'vscode';
import { Repository } from './repository';
import { IRemoteSourceProviderRegistry } from './remoteProvider';
export declare class StatusBarCommands {
    readonly onDidChange: Event<void>;
    private syncStatusBar;
    private checkoutStatusBar;
    private disposables;
    constructor(repository: Repository, remoteSourceProviderRegistry: IRemoteSourceProviderRegistry);
    get commands(): Command[];
    dispose(): void;
}
