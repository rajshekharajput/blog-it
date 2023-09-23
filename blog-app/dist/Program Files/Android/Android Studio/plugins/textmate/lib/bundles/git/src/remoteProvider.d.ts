import { Disposable, Event } from 'vscode';
import { RemoteSourceProvider } from './api/git';
export interface IRemoteSourceProviderRegistry {
    readonly onDidAddRemoteSourceProvider: Event<RemoteSourceProvider>;
    readonly onDidRemoveRemoteSourceProvider: Event<RemoteSourceProvider>;
    registerRemoteSourceProvider(provider: RemoteSourceProvider): Disposable;
    getRemoteProviders(): RemoteSourceProvider[];
}
