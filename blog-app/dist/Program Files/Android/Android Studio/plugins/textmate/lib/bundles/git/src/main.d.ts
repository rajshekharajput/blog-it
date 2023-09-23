import { ExtensionContext } from 'vscode';
import { GitExtension } from './api/git';
import { GitExtensionImpl } from './api/extension';
export declare function deactivate(): Promise<any>;
export declare function _activate(context: ExtensionContext): Promise<GitExtensionImpl>;
export declare function getExtensionContext(): ExtensionContext;
export declare function activate(context: ExtensionContext): Promise<GitExtension>;
