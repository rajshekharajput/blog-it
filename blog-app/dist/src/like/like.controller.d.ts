import { LikeService } from "./like.service";
import { LikeDto } from "./dto/like.dto";
export declare class LikeController {
    private likeService;
    constructor(likeService: LikeService);
    likePost(likeDto: LikeDto): Promise<import("./like.entity").Like>;
}
