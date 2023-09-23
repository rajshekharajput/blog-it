"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const post_entity_1 = require("./post.entity");
const user_module_1 = require("../user/user.module");
const post_service_1 = require("./post.service");
const post_controller_1 = require("./post.controller");
const authorization_module_1 = require("../authorization/authorization.module");
const file_service_1 = require("../file/file.service");
const tag_module_1 = require("../tag/tag.module");
let PostModule = class PostModule {
};
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
exports.PostModule = PostModule;
//# sourceMappingURL=post.module.js.map