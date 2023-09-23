import { Comment } from "../comment/commnet.entity";
import { Like } from "../like/like.entity";
import { Tag } from "../tag/tag.entity";
export declare class Post {
    id: number;
    title: string;
    text: string;
    dateAndTimePublish: Date;
    userLikes: Like[];
    postImage: string;
    user: number;
    comments: Comment[];
    tags: Tag[];
}
