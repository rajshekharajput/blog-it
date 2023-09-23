import { Model } from '../model';
import { GitExtension, Repository, API } from './git';
import { Event } from 'vscode';
export declare function deprecated(_target: any, key: string, descriptor: any): void;
export declare class GitExtensionImpl implements GitExtension {
    enabled: boolean;
    private _onDidChangeEnablement;
    readonly onDidChangeEnablement: Event<boolean>;
    private _model;
    set model(model: Model | undefined);
    get model(): Model | undefined;
    constructor(model?: Model);
    getGitPath(): Promise<string>;
    getRepositories(): Promise<Repository[]>;
    getAPI(version: number): API;
}
