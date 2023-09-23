"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.LikeModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var like_entity_1 = require("./like.entity");
var user_module_1 = require("../user/user.module");
var post_module_1 = require("../post/post.module");
var like_service_1 = require("./like.service");
var like_controller_1 = require("./like.controller");
var authorization_module_1 = require("../authorization/authorization.module");
var LikeModule = /** @class */ (function () {
    function LikeModule() {
    }
    LikeModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([like_entity_1.Like]),
                user_module_1.UserModule,
                post_module_1.PostModule,
                authorization_module_1.AuthorizationModule
            ],
            providers: [like_service_1.LikeService],
            controllers: [like_controller_1.LikeController]
        })
    ], LikeModule);
    return LikeModule;
}());
exports.LikeModule = LikeModule;
