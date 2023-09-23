import { Token } from "./token.entity";
import { Repository } from "typeorm";
import { User } from "../user/user.entity";
import { JwtService } from "@nestjs/jwt";
import { UserService } from "../user/user.service";
export declare class TokenService {
    private tokenRepository;
    private jwtService;
    private userService;
    constructor(tokenRepository: Repository<Token>, jwtService: JwtService, userService: UserService);
    generateTokens(user: User): {
        accessToken: string;
        refreshToken: string;
    };
    saveToken(userId: number, refreshToken: string): Promise<Token>;
    removeToken(refreshToken: string): Promise<void>;
    validateRefreshToken(token: string): any;
    findToken(refreshToken: string): Promise<Token>;
}
