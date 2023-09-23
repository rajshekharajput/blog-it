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
exports.PostService = void 0;
var common_1 = require("@nestjs/common");
var typeorm_1 = require("@nestjs/typeorm");
var post_entity_1 = require("./post.entity");
var _ = require('lodash');
var PostService = /** @class */ (function () {
    function PostService(postRepository, usersService, fileService, tagService) {
        this.postRepository = postRepository;
        this.usersService = usersService;
        this.fileService = fileService;
        this.tagService = tagService;
    }
    PostService.prototype.createPost = function (postDto, files) {
        return __awaiter(this, void 0, void 0, function () {
            var picture, picturePath, post, tagsArray, arrayTag;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        picture = files.picture;
                        if (!picture) {
                            throw new common_1.HttpException('Image not provided', common_1.HttpStatus.BAD_REQUEST);
                        }
                        return [4 /*yield*/, this.fileService.createFile(picture[0])];
                    case 1:
                        picturePath = _a.sent();
                        post = new post_entity_1.Post();
                        if (postDto.tags) {
                            tagsArray = postDto.tags.map(function (tag) { return JSON.parse(JSON.stringify(tag)); });
                            arrayTag = tagsArray.map(function (tag) { return JSON.parse(tag); });
                            post.tags = arrayTag;
                        }
                        post.title = postDto.title;
                        post.text = postDto.text;
                        post.user = Number(postDto.userId);
                        post.postImage = picturePath;
                        post.dateAndTimePublish = new Date();
                        return [4 /*yield*/, this.postRepository.save(post)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, this.getPostById(post.id)];
                }
            });
        });
    };
    PostService.prototype.updatePost = function (updatePostDto, files) {
        return __awaiter(this, void 0, void 0, function () {
            var postId, title, text, postImage, arrayTag, post, picture, tagsArray;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        postId = updatePostDto.postId;
                        title = updatePostDto.title, text = updatePostDto.text, postImage = updatePostDto.postImage;
                        return [4 /*yield*/, this.getPostById(postId)];
                    case 1:
                        post = _a.sent();
                        if (!files) return [3 /*break*/, 3];
                        picture = files.picture;
                        return [4 /*yield*/, this.fileService.createFile(picture[0])];
                    case 2:
                        postImage = _a.sent();
                        if (updatePostDto.tags) {
                            tagsArray = updatePostDto.tags.map(function (tag) { return JSON.parse(JSON.stringify(tag)); });
                            arrayTag = tagsArray.map(function (tag) { return JSON.parse(tag); });
                        }
                        _a.label = 3;
                    case 3:
                        post.title = title;
                        post.text = text;
                        post.postImage = postImage;
                        post.tags = arrayTag ? arrayTag : updatePostDto.tags;
                        return [4 /*yield*/, this.postRepository.save(post)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, this.getPostById(postId)];
                }
            });
        });
    };
    PostService.prototype.deletePost = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository["delete"](postId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostService.prototype.getPostById = function (postId) {
        return __awaiter(this, void 0, void 0, function () {
            var post;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository.findOne(postId, {
                            relations: ['comments', 'userLikes']
                        })];
                    case 1:
                        post = _a.sent();
                        if (post) {
                            return [2 /*return*/, post];
                        }
                        else {
                            throw new common_1.HttpException('Post not found', common_1.HttpStatus.NOT_FOUND);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PostService.prototype.getLatestPosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.postRepository.find({
                        relations: ['comments', 'userLikes'],
                        order: {
                            dateAndTimePublish: 'DESC'
                        }
                    })];
            });
        });
    };
    PostService.prototype.getHotPosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository.find({
                            relations: ['comments', 'userLikes']
                        })];
                    case 1:
                        posts = _a.sent();
                        return [2 /*return*/, _.orderBy(posts, function (post) { return post.comments.length; }, ['desc'])];
                }
            });
        });
    };
    PostService.prototype.getTopPosts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository.find({
                            relations: ['comments', 'userLikes']
                        })];
                    case 1:
                        posts = _a.sent();
                        return [2 /*return*/, _.orderBy(posts, function (post) { return post.userLikes.length; }, ['desc'])];
                }
            });
        });
    };
    PostService.prototype.getPostsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository.find({
                            relations: ['comments', 'userLikes'],
                            where: {
                                user: userId
                            }
                        })];
                    case 1:
                        posts = _a.sent();
                        return [2 /*return*/, posts];
                }
            });
        });
    };
    PostService.prototype.getPostsByTagId = function (tagId) {
        return __awaiter(this, void 0, void 0, function () {
            var posts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.postRepository.find()];
                    case 1:
                        posts = _a.sent();
                        return [2 /*return*/, posts.filter(function (post) { return post.tags.some(function (tag) { return tag.id === tagId; }); })];
                }
            });
        });
    };
    PostService = __decorate([
        (0, common_1.Injectable)(),
        __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post))
    ], PostService);
    return PostService;
}());
exports.PostService = PostService;
