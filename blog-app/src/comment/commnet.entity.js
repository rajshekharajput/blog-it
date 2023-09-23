"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Comment = void 0;
var typeorm_1 = require("typeorm");
var user_entity_1 = require("../user/user.entity");
var post_entity_1 = require("../post/post.entity");
var Comment = /** @class */ (function () {
    function Comment() {
    }
    __decorate([
        (0, typeorm_1.PrimaryGeneratedColumn)()
    ], Comment.prototype, "id");
    __decorate([
        (0, typeorm_1.Column)()
    ], Comment.prototype, "text");
    __decorate([
        (0, typeorm_1.Column)()
    ], Comment.prototype, "dateAndTimePublish");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return user_entity_1.User; }, function (user) { return user.comments; }, { eager: true })
    ], Comment.prototype, "user");
    __decorate([
        (0, typeorm_1.ManyToOne)(function () { return post_entity_1.Post; }, function (post) { return post.comments; }, { onDelete: 'CASCADE' })
    ], Comment.prototype, "post");
    Comment = __decorate([
        (0, typeorm_1.Entity)({ name: 'comments' })
    ], Comment);
    return Comment;
}());
exports.Comment = Comment;
