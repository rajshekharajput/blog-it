import { Memento } from 'vscode';
import { Repository } from './repository';
export declare class AutoFetcher {
    private repository;
    private globalState;
    private static DidInformUser;
    private _onDidChange;
    private onDidChange;
    private _enabled;
    private _fetchAll;
    get enabled(): boolean;
    set enabled(enabled: boolean);
    private disposables;
    constructor(repository: Repository, globalState: Memento);
    private onFirstGoodRemoteOperation;
    private onConfiguration;
    enable(): void;
    disable(): void;
    private run;
    dispose(): void;
}
