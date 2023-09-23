"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.TokenModule = void 0;
var common_1 = require("@nestjs/common");
var token_service_1 = require("./token.service");
var typeorm_1 = require("@nestjs/typeorm");
var token_entity_1 = require("./token.entity");
var jwt_1 = require("@nestjs/jwt");
var user_module_1 = require("../user/user.module");
var TokenModule = /** @class */ (function () {
    function TokenModule() {
    }
    TokenModule = __decorate([
        (0, common_1.Module)({
            imports: [
                jwt_1.JwtModule.register({}),
                typeorm_1.TypeOrmModule.forFeature([token_entity_1.Token]),
                user_module_1.UserModule
            ],
            providers: [token_service_1.TokenService],
            exports: [token_service_1.TokenService]
        })
    ], TokenModule);
    return TokenModule;
}());
exports.TokenModule = TokenModule;
