"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.TokenService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var token_entity_1 = require("./token.entity");
var TokenService = /** @class */ (function () {
    function TokenService(tokenRepository, jwtService, userService) {
        this.tokenRepository = tokenRepository;
        this.jwtService = jwtService;
        this.userService = userService;
    }
    TokenService.prototype.generateTokens = function (user) {
        var payload = { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email };
        var accessToken = this.jwtService.sign(payload, { expiresIn: '10m', secret: process.env.ACCESS_SECRET });
        var refreshToken = this.jwtService.sign(payload, { expiresIn: '30d', secret: process.env.REFRESH_SECRET });
        return {
            accessToken: accessToken,
            refreshToken: refreshToken
        };
    };
    TokenService.prototype.saveToken = function (userId, refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            var userWithToken, tokenData, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.userService.getById(userId)];
                    case 1:
                        userWithToken = _a.sent();
                        return [4 /*yield*/, this.tokenRepository.findOne({ user: userWithToken })];
                    case 2:
                        tokenData = _a.sent();
                        if (tokenData) {
                            tokenData.refreshToken = refreshToken;
                            return [2 /*return*/, this.tokenRepository.save(tokenData)];
                        }
                        token = new token_entity_1.Token();
                        token.user = userWithToken;
                        token.refreshToken = refreshToken;
                        return [4 /*yield*/, this.tokenRepository.save(token)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    TokenService.prototype.removeToken = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tokenRepository["delete"]({ refreshToken: refreshToken })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TokenService.prototype.validateRefreshToken = function (token) {
        try {
            return this.jwtService.verify(token, { secret: process.env.REFRESH_SECRET });
        }
        catch (e) {
            throw new common_1.HttpException('Token is invalid!!!', common_1.HttpStatus.UNAUTHORIZED);
        }
    };
    TokenService.prototype.findToken = function (refreshToken) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tokenRepository.findOne({ refreshToken: refreshToken }, { relations: ['user'] })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    TokenService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(token_entity_1.Token))
    ], TokenService);
    return TokenService;
}());
exports.TokenService = TokenService;
