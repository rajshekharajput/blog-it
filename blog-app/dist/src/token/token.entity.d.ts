import { User } from "../user/user.entity";
export declare class Token {
    id: number;
    refreshToken: string;
    user: User;
}
