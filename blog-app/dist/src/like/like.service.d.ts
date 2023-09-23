import { Repository } from "typeorm";
import { Like } from "./like.entity";
import { LikeDto } from "./dto/like.dto";
import { PostService } from "../post/post.service";
import { UserService } from "../user/user.service";
export declare class LikeService {
    private likeRepository;
    private postService;
    private userService;
    constructor(likeRepository: Repository<Like>, postService: PostService, userService: UserService);
    likePost(likeDto: LikeDto): Promise<Like>;
}
