import { RemoteSourceProvider } from './api/git';
import { Model } from './model';
export interface PickRemoteSourceOptions {
    readonly providerLabel?: (provider: RemoteSourceProvider) => string;
    readonly urlLabel?: string;
    readonly providerName?: string;
    readonly branch?: boolean;
}
export interface PickRemoteSourceResult {
    readonly url: string;
    readonly branch?: string;
}
export declare function pickRemoteSource(model: Model, options: PickRemoteSourceOptions & {
    branch?: false | undefined;
}): Promise<string | undefined>;
export declare function pickRemoteSource(model: Model, options: PickRemoteSourceOptions & {
    branch: true;
}): Promise<PickRemoteSourceResult | undefined>;
