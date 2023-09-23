import { TextDocument, Range, LineChange, Selection } from 'vscode';
export declare function applyLineChanges(original: TextDocument, modified: TextDocument, diffs: LineChange[]): string;
export declare function toLineRanges(selections: Selection[], textDocument: TextDocument): Range[];
export declare function getModifiedRange(textDocument: TextDocument, diff: LineChange): Range;
export declare function intersectDiffWithRange(textDocument: TextDocument, diff: LineChange, range: Range): LineChange | null;
export declare function invertLineChange(diff: LineChange): LineChange;
