import { Model } from './model';
export declare class GitDecorations {
    private model;
    private disposables;
    private modelDisposables;
    private providers;
    constructor(model: Model);
    private update;
    private enable;
    private disable;
    private onDidOpenRepository;
    private onDidCloseRepository;
    dispose(): void;
}
