import { Uri, Event } from 'vscode';
import { Model } from './model';
export declare class GitContentProvider {
    private model;
    private _onDidChange;
    get onDidChange(): Event<Uri>;
    private changedRepositoryRoots;
    private cache;
    private disposables;
    constructor(model: Model);
    private onDidChangeRepository;
    private onDidChangeOriginalResource;
    private eventuallyFireChangeEvents;
    private fireChangeEvents;
    provideTextDocumentContent(uri: Uri): Promise<string>;
    private cleanup;
    dispose(): void;
}
