export declare class FileService {
    createFile(file: any): Promise<string>;
    uploadToFirebase(filePath: string, fileName: string): Promise<any>;
}
