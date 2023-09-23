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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const token_entity_1 = require("./token.entity");
const typeorm_2 = require("typeorm");
const jwt_1 = require("@nestjs/jwt");
const user_service_1 = require("../user/user.service");
let TokenService = class TokenService {
    constructor(tokenRepository, jwtService, userService) {
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.userService = userService;
    }
    generateTokens(user) {
        const payload = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '10m', secret: process.env.ACCESS_SECRET });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d', secret: process.env.REFRESH_SECRET });
        return {
            accessToken,
            refreshToken
        };
    }
    async saveToken(userId, refreshToken) {
        const userWithToken = await this.userService.getById(userId);
        const tokenData = await this.tokenRepository.findOne({ user: userWithToken });
        if (tokenData) {
            tokenData.refreshToken = refreshToken;
            return this.tokenRepository.save(tokenData);
        }
        const token = new token_entity_1.Token();
        token.user = userWithToken;
        token.refreshToken = refreshToken;
        await this.tokenRepository.save(token);
        return token;
    }
    async removeToken(refreshToken) {
        await this.tokenRepository.delete({ refreshToken: refreshToken });
    }
    validateRefreshToken(token) {
        try {
            return this.jwtService.verify(token, { secret: process.env.REFRESH_SECRET });
        }
        catch (e) {
            throw new common_1.HttpException('Token is invalid!!!', common_1.HttpStatus.UNAUTHORIZED);
        }
    }
    async findToken(refreshToken) {
        return await this.tokenRepository.findOne({ refreshToken: refreshToken }, { relations: ['user'] });
    }
};
TokenService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(token_entity_1.Token)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        user_service_1.UserService])
], TokenService);
exports.TokenService = TokenService;
//# sourceMappingURL=token.service.js.map