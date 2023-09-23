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
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const security_service_1 = require("./security.service");
const user_dto_1 = require("../user/dto/user.dto");
const login_user_dto_1 = require("../user/dto/login.user.dto");
const update_user_dto_1 = require("../user/dto/update-user.dto");
const platform_express_1 = require("@nestjs/platform-express");
const user_service_1 = require("../user/user.service");
const auth_guard_1 = require("../authorization/auth.guard");
let SecurityController = class SecurityController {
    constructor(securityService, userService) {
        this.securityService = securityService;
        this.userService = userService;
    }
    async register(userDto, res) {
        const userData = await this.securityService.registration(userDto);
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.json(userData);
    }
    async login(loginUserDto, res) {
        const userData = await this.securityService.login(loginUserDto);
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.json(userData);
    }
    async logout(req, res) {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            throw new common_1.HttpException('Logged out', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.securityService.logout(refreshToken);
        res.clearCookie('refreshToken');
        res.sendStatus(common_1.HttpStatus.OK);
    }
    async refresh(req, res) {
        const { refreshToken } = req.cookies;
        const userData = await this.securityService.refresh(refreshToken);
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.json(userData);
    }
    async updateUser(files, user) {
        return this.userService.updateUser(user, files);
    }
};
__decorate([
    (0, common_1.UsePipes)(common_1.ValidationPipe),
    (0, common_1.Post)('/register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.UserDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "register", null);
__decorate([
    (0, common_1.UsePipes)(common_1.ValidationPipe),
    (0, common_1.Post)('/login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_user_dto_1.LoginUserDto, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, common_1.Delete)('/logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('/refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "refresh", null);
__decorate([
    (0, common_1.Put)('/update'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'picture', maxCount: 1 }
    ])),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "updateUser", null);
SecurityController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [security_service_1.SecurityService,
        user_service_1.UserService])
], SecurityController);
exports.SecurityController = SecurityController;
//# sourceMappingURL=security.controller.js.map