import { CommentService } from "./comment.service";
import { CommentDto } from "./dto/comment.dto";
export declare class CommentController {
    private commentService;
    constructor(commentService: CommentService);
    create(commentDto: CommentDto): Promise<import("./commnet.entity").Comment>;
}
