import { Uri, Disposable, Event, FileSystemProvider, FileChangeEvent, FileStat, FileType } from 'vscode';
import { Model } from './model';
export declare class GitFileSystemProvider implements FileSystemProvider {
    private model;
    private _onDidChangeFile;
    readonly onDidChangeFile: Event<FileChangeEvent[]>;
    private changedRepositoryRoots;
    private cache;
    private mtime;
    private disposables;
    constructor(model: Model);
    private onDidChangeRepository;
    private onDidChangeOriginalResource;
    private eventuallyFireChangeEvents;
    private fireChangeEvents;
    private cleanup;
    watch(): Disposable;
    stat(uri: Uri): Promise<FileStat>;
    readDirectory(): Thenable<[string, FileType][]>;
    createDirectory(): void;
    readFile(uri: Uri): Promise<Uint8Array>;
    writeFile(): void;
    delete(): void;
    rename(): void;
    dispose(): void;
}
