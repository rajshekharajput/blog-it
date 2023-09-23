import { PostService } from "./post.service";
import { PostDto } from "./dto/post.dto";
import { UpdatePostDto } from "./dto/update.post.dto";
export declare class PostController {
    private postService;
    constructor(postService: PostService);
    create(files: any, postDto: PostDto): Promise<import("./post.entity").Post>;
    update(files: any, post: UpdatePostDto): Promise<import("./post.entity").Post>;
    delete(postId: number): Promise<void>;
    getPostById(postId: number): Promise<import("./post.entity").Post>;
    getLatestPosts(): Promise<import("./post.entity").Post[]>;
    getHotPosts(): Promise<any>;
    getTopPosts(): Promise<any>;
    getPostsByUserId(userId: number): Promise<import("./post.entity").Post[]>;
    getPostsByTagId(tagId: number): Promise<import("./post.entity").Post[]>;
}
