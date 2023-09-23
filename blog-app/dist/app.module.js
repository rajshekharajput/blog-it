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
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_module_1 = require("./user/user.module");
const post_module_1 = require("./post/post.module");
const comment_module_1 = require("./comment/comment.module");
const security_module_1 = require("./security/security.module");
const token_module_1 = require("./token/token.module");
const authorization_module_1 = require("./authorization/authorization.module");
const file_module_1 = require("./file/file.module");
const serve_static_1 = require("@nestjs/serve-static");
const like_module_1 = require("./like/like.module");
const path = require("path");
const tag_module_1 = require("./tag/tag.module");
let AppModule = class AppModule {
    constructor(connection) {
        this.connection = connection;
        console.log(connection.isConnected);
    }
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: `.${process.env.NODE_ENV}.env`
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
        providers: [],
    }),
    __metadata("design:paramtypes", [typeorm_2.Connection])
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map