"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Like = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../user/user.entity");
var post_entity_1 = require("../post/post.entity");
var Like = /** @class */ (function () {
    function Like() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], Like.prototype, "id");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.likedPosts; }, { eager: true })
    ], Like.prototype, "user");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return post_entity_1.Post; }, function (post) { return post.userLikes; }, { onDelete: 'CASCADE' })
    ], Like.prototype, "post");
    Like = __decorate([
        (0, typeorm_1.Entity)({ name: 'likes' })
    ], Like);
    return Like;
}());
exports.Like = Like;
