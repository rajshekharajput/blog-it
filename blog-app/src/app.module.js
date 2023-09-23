"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var typeorm_1 = require("@nestjs/typeorm");
var user_module_1 = require("./user/user.module");
var post_module_1 = require("./post/post.module");
var comment_module_1 = require("./comment/comment.module");
var security_module_1 = require("./security/security.module");
var token_module_1 = require("./token/token.module");
var authorization_module_1 = require("./authorization/authorization.module");
var file_module_1 = require("./file/file.module");
var serve_static_1 = require("@nestjs/serve-static");
var like_module_1 = require("./like/like.module");
var path = require("path");
var tag_module_1 = require("./tag/tag.module");
var AppModule = /** @class */ (function () {
    function AppModule(connection) {
        this.connection = connection;
        console.log(connection.isConnected);
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                config_1.ConfigModule.forRoot({
                    envFilePath: ".".concat(process.env.NODE_ENV, ".env")
                }),
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: process.env.DB_HOST,
                    port: Number(process.env.DB_PORT),
                    username: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD,
                    database: process.env.DB_NAME,
                    entities: [],
                    synchronize: true,
                    autoLoadEntities: true
                }),
                user_module_1.UserModule,
                post_module_1.PostModule,
                comment_module_1.CommentModule,
                security_module_1.SecurityModule,
                token_module_1.TokenModule,
                authorization_module_1.AuthorizationModule,
                file_module_1.FileModule,
                serve_static_1.ServeStaticModule.forRoot({
                    rootPath: path.resolve(__dirname, 'static')
                }),
                like_module_1.LikeModule,
                tag_module_1.TagModule
            ],
            controllers: [],
            providers: []
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
