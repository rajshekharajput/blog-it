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
exports.LikeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const like_entity_1 = require("./like.entity");
const post_service_1 = require("../post/post.service");
const user_service_1 = require("../user/user.service");
let LikeService = class LikeService {
    constructor(likeRepository, postService, userService) {
        this.likeRepository = likeRepository;
        this.postService = postService;
        this.userService = userService;
    }
    async likePost(likeDto) {
        const like = new like_entity_1.Like();
        like.user = likeDto.userId;
        like.post = likeDto.postId;
        const newLike = await this.likeRepository.save(like);
        return await this.likeRepository.findOne(newLike.id, { relations: ['post'] });
    }
};
LikeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(like_entity_1.Like)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        post_service_1.PostService,
        user_service_1.UserService])
], LikeService);
exports.LikeService = LikeService;
//# sourceMappingURL=like.service.js.map