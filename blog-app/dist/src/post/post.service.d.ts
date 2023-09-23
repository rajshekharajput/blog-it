import { Post } from "./post.entity";
import { Repository } from "typeorm";
import { PostDto } from "./dto/post.dto";
import { UserService } from "../user/user.service";
import { FileService } from "../file/file.service";
import { UpdatePostDto } from "./dto/update.post.dto";
import { TagService } from "../tag/tag.service";
export declare class PostService {
    private postRepository;
    private usersService;
    private fileService;
    private tagService;
    constructor(postRepository: Repository<Post>, usersService: UserService, fileService: FileService, tagService: TagService);
    createPost(postDto: PostDto, files: any): Promise<Post>;
    updatePost(updatePostDto: UpdatePostDto, files: any): Promise<Post>;
    deletePost(postId: number): Promise<void>;
    getPostById(postId: number): Promise<Post>;
    getLatestPosts(): Promise<Post[]>;
    getHotPosts(): Promise<any>;
    getTopPosts(): Promise<any>;
    getPostsByUserId(userId: number): Promise<Post[]>;
    getPostsByTagId(tagId: number): Promise<Post[]>;
}
