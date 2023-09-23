import { SecurityService } from "./security.service";
import { UserDto } from "../user/dto/user.dto";
import { LoginUserDto } from "../user/dto/login.user.dto";
import { UpdateUserDto } from "../user/dto/update-user.dto";
import { UserService } from "../user/user.service";
export declare class SecurityController {
    private securityService;
    private userService;
    constructor(securityService: SecurityService, userService: UserService);
    register(userDto: UserDto, res: any): Promise<void>;
    login(loginUserDto: LoginUserDto, res: any): Promise<void>;
    logout(req: any, res: any): Promise<void>;
    refresh(req: any, res: any): Promise<void>;
    updateUser(files: any, user: UpdateUserDto): Promise<import("../user/user.entity").User>;
}
