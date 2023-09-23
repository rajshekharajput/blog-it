import { Repository } from "typeorm";
import { User } from "./user.entity";
import { UserDto } from "./dto/user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { FileService } from "../file/file.service";
export declare class UserService {
    private usersRepository;
    private fileService;
    constructor(usersRepository: Repository<User>, fileService: FileService);
    createUser(userDto: UserDto | User): Promise<User>;
    updateUser(updateUserDto: UpdateUserDto, file: any): Promise<User>;
    getAllUsers(): Promise<User[]>;
    getById(userId: number): Promise<User>;
    getByEmail(email: string): Promise<User>;
}
