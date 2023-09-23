import { Post } from "../post/post.entity";
import { Comment } from "../comment/commnet.entity";
import { Like } from "../like/like.entity";
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MANAGER = "manager"
}
export declare class User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profilePicture: string;
    role: UserRole;
    posts: Post[];
    comments: Comment[];
    likedPosts: Like[];
}
