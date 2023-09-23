"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.User = exports.UserRole = void 0;
var typeorm_1 = require("typeorm");
var post_entity_1 = require("../post/post.entity");
var commnet_entity_1 = require("../comment/commnet.entity");
var like_entity_1 = require("../like/like.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["MANAGER"] = "manager";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var User = /** @class */ (function () {
    function User() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], User.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "firstName");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "lastName");
    __decorate([
        (0, typeorm_1.Column)({ unique: true })
    ], User.prototype, "email");
    __decorate([
        (0, typeorm_1.Column)()
    ], User.prototype, "password");
    __decorate([
        (0, typeorm_1.Column)({ "default": 'https://firebasestorage.googleapis.com/v0/b/post-images-storage.appspot.com/o/%2Fposts%2Fsquare_avatar.png?alt=media&token=1bf5a1c9-9691-45dc-bd26-b2d1753f7c53' })
    ], User.prototype, "profilePicture");
    __decorate([
        (0, typeorm_1.Column)({ type: "enum", "enum": UserRole, "default": UserRole.USER })
    ], User.prototype, "role");
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return post_entity_1.Post; }, function (post) { return post.user; })
    ], User.prototype, "posts");
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return commnet_entity_1.Comment; }, function (comment) { return comment.user; })
    ], User.prototype, "comments");
    __decorate([
        (0, typeorm_1.OneToMany)(function () { return like_entity_1.Like; }, function (like) { return like.user; })
    ], User.prototype, "likedPosts");
    User = __decorate([
        (0, typeorm_1.Entity)({ name: 'users' })
    ], User);
    return User;
}());
exports.User = User;
