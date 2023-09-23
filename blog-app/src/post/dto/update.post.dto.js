"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.UpdatePostDto = void 0;
var class_validator_1 = require("class-validator");
var UpdatePostDto = /** @class */ (function () {
    function UpdatePostDto() {
    }
    __decorate([
        (0, class_validator_1.MinLength)(10, { message: 'Title is too short!' }),
        (0, class_validator_1.MaxLength)(80, { message: 'Title is too long!' }),
        (0, class_validator_1.IsString)({ message: 'Title must be string' })
    ], UpdatePostDto.prototype, "title");
    __decorate([
        (0, class_validator_1.MinLength)(15, { message: 'Text is too short!' }),
        (0, class_validator_1.IsString)({ message: 'Title must be string' })
    ], UpdatePostDto.prototype, "text");
    __decorate([
        (0, class_validator_1.IsNotEmpty)({ message: 'Empty post id' })
    ], UpdatePostDto.prototype, "postId");
    __decorate([
        (0, class_validator_1.IsNotEmpty)({ message: 'Empty image' })
    ], UpdatePostDto.prototype, "postImage");
    return UpdatePostDto;
}());
exports.UpdatePostDto = UpdatePostDto;
