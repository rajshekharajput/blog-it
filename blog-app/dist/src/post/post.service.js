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
exports.PostService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const post_entity_1 = require("./post.entity");
const typeorm_2 = require("typeorm");
const user_service_1 = require("../user/user.service");
const file_service_1 = require("../file/file.service");
const tag_service_1 = require("../tag/tag.service");
const _ = require('lodash');
let PostService = class PostService {
    constructor(postRepository, usersService, fileService, tagService) {
        this.postRepository = postRepository;
        this.usersService = usersService;
        this.fileService = fileService;
        this.tagService = tagService;
    }
    async createPost(postDto, files) {
        const { picture } = files;
        if (!picture) {
            throw new common_1.HttpException('Image not provided', common_1.HttpStatus.BAD_REQUEST);
        }
        const picturePath = await this.fileService.createFile(picture[0]);
        const post = new post_entity_1.Post();
        if (postDto.tags) {
            const tagsArray = postDto.tags.map(tag => JSON.parse(JSON.stringify(tag)));
            const arrayTag = tagsArray.map(tag => JSON.parse(tag));
            post.tags = arrayTag;
        }
        post.title = postDto.title;
        post.text = postDto.text;
        post.user = Number(postDto.userId);
        post.postImage = picturePath;
        post.dateAndTimePublish = new Date();
        await this.postRepository.save(post);
        return this.getPostById(post.id);
    }
    async updatePost(updatePostDto, files) {
        const postId = updatePostDto.postId;
        let { title, text, postImage } = updatePostDto;
        let arrayTag;
        const post = await this.getPostById(postId);
        if (files) {
            const { picture } = files;
            postImage = await this.fileService.createFile(picture[0]);
            if (updatePostDto.tags) {
                const tagsArray = updatePostDto.tags.map(tag => JSON.parse(JSON.stringify(tag)));
                arrayTag = tagsArray.map(tag => JSON.parse(tag));
            }
        }
        post.title = title;
        post.text = text;
        post.postImage = postImage;
        post.tags = arrayTag ? arrayTag : updatePostDto.tags;
        await this.postRepository.save(post);
        return this.getPostById(postId);
    }
    async deletePost(postId) {
        await this.postRepository.delete(postId);
    }
    async getPostById(postId) {
        const post = await this.postRepository.findOne(postId, {
            relations: ['comments', 'userLikes']
        });
        if (post) {
            return post;
        }
        else {
            throw new common_1.HttpException('Post not found', common_1.HttpStatus.NOT_FOUND);
        }
    }
    async getLatestPosts() {
        return this.postRepository.find({
            relations: ['comments', 'userLikes'],
            order: {
                dateAndTimePublish: 'DESC'
            }
        });
    }
    async getHotPosts() {
        const posts = await this.postRepository.find({
            relations: ['comments', 'userLikes'],
        });
        return _.orderBy(posts, post => post.comments.length, ['desc']);
    }
    async getTopPosts() {
        const posts = await this.postRepository.find({
            relations: ['comments', 'userLikes'],
        });
        return _.orderBy(posts, post => post.userLikes.length, ['desc']);
    }
    async getPostsByUserId(userId) {
        const posts = await this.postRepository.find({
            relations: ['comments', 'userLikes'],
            where: {
                user: userId
            }
        });
        return posts;
    }
    async getPostsByTagId(tagId) {
        const posts = await this.postRepository.find();
        return posts.filter(post => post.tags.some(tag => tag.id === tagId));
    }
};
PostService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        user_service_1.UserService,
        file_service_1.FileService,
        tag_service_1.TagService])
], PostService);
exports.PostService = PostService;
//# sourceMappingURL=post.service.js.map