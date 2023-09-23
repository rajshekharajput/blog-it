"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
const common_1 = require("@nestjs/common");
const token_service_1 = require("../token/token.service");
const user_service_1 = require("../user/user.service");
const bcrypt = require("bcryptjs");
let SecurityService = class SecurityService {
    constructor(tokenService, userService) {
        this.tokenService = tokenService;
        this.userService = userService;
    }
    async registration(userDto) {
        const candidate = await this.userService.getByEmail(userDto.email);
        if (candidate) {
            throw new common_1.HttpException(`User with email: ${userDto.email} already exists`, common_1.HttpStatus.BAD_REQUEST);
        }
        const hashedPassword = await bcrypt.hash(userDto.password, 5);
        const user = await this.userService.createUser(Object.assign(Object.assign({}, userDto), { password: hashedPassword }));
        const tokens = this.tokenService.generateTokens(user);
        await this.tokenService.saveToken(user.id, tokens.refreshToken);
        return Object.assign(Object.assign({}, tokens), { user: Object.assign(Object.assign({}, user), { posts: [] }) });
    }
    async login(loginUserDto) {
        const user = await this.userService.getByEmail(loginUserDto.email);
        if (!user) {
            throw new common_1.HttpException(`User with email: ${loginUserDto.email} not found`, common_1.HttpStatus.NOT_FOUND);
        }
        const passwordMatch = await bcrypt.compare(loginUserDto.password, user.password);
        if (!passwordMatch) {
            throw new common_1.HttpException('Password is invalid', common_1.HttpStatus.UNAUTHORIZED);
        }
        const tokens = this.tokenService.generateTokens(user);
        await this.tokenService.saveToken(user.id, tokens.refreshToken);
        return Object.assign(Object.assign({}, tokens), { user });
    }
    async logout(refreshToken) {
        await this.tokenService.removeToken(refreshToken);
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new common_1.HttpException('Token is not provided', common_1.HttpStatus.UNAUTHORIZED);
        }
        const userData = await this.tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await this.tokenService.findToken(refreshToken);
        if (!userData || !tokenFromDb) {
            throw new common_1.HttpException('Token is invalid', common_1.HttpStatus.UNAUTHORIZED);
        }
        const user = await this.userService.getById(tokenFromDb.user.id);
        const tokens = this.tokenService.generateTokens(user);
        await this.tokenService.saveToken(user.id, tokens.refreshToken);
        return Object.assign(Object.assign({}, tokens), { user });
    }
};
SecurityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [token_service_1.TokenService,
        user_service_1.UserService])
], SecurityService);
exports.SecurityService = SecurityService;
//# sourceMappingURL=security.service.js.map