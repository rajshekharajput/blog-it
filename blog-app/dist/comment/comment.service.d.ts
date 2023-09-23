import { Comment } from "./commnet.entity";
import { Repository } from "typeorm";
import { CommentDto } from "./dto/comment.dto";
export declare class CommentService {
    private commentRepository;
    constructor(commentRepository: Repository<Comment>);
    createComment(commentDto: CommentDto): Promise<Comment>;
}
