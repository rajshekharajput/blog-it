import { TokenService } from "../token/token.service";
import { UserDto } from "../user/dto/user.dto";
import { UserService } from "../user/user.service";
import { LoginUserDto } from "../user/dto/login.user.dto";
import { User } from "../user/user.entity";
export declare class SecurityService {
    private tokenService;
    private userService;
    constructor(tokenService: TokenService, userService: UserService);
    registration(userDto: UserDto): Promise<{
        user: {
            posts: any[];
            id: number;
            firstName: string;
            lastName: string;
            email: string;
            password: string;
            profilePicture: string;
            role: import("../user/user.entity").UserRole;
            comments: import("../comment/commnet.entity").Comment[];
            likedPosts: import("../like/like.entity").Like[];
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(loginUserDto: LoginUserDto): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    refresh(refreshToken: any): Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
}
