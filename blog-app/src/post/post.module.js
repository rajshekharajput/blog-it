"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PostModule = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var post_entity_1 = require("./post.entity");
var user_module_1 = require("../user/user.module");
var post_service_1 = require("./post.service");
var post_controller_1 = require("./post.controller");
var authorization_module_1 = require("../authorization/authorization.module");
var file_service_1 = require("../file/file.service");
var tag_module_1 = require("../tag/tag.module");
var PostModule = /** @class */ (function () {
    function PostModule() {
    }
    PostModule = __decorate([
        (0, common_1.Module)({
            imports: [
                typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post]),
                user_module_1.UserModule,
                tag_module_1.TagModule,
                authorization_module_1.AuthorizationModule
            ],
            providers: [post_service_1.PostService, file_service_1.FileService],
            controllers: [post_controller_1.PostController],
            exports: [post_service_1.PostService]
        })
    ], PostModule);
    return PostModule;
}());
exports.PostModule = PostModule;
