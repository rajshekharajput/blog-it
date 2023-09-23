"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.SecurityModule = void 0;
var common_1 = require("@nestjs/common");
var user_module_1 = require("../user/user.module");
var token_module_1 = require("../token/token.module");
var security_service_1 = require("./security.service");
var security_controller_1 = require("./security.controller");
var authorization_module_1 = require("../authorization/authorization.module");
var SecurityModule = /** @class */ (function () {
    function SecurityModule() {
    }
    SecurityModule = __decorate([
        (0, common_1.Module)({
            imports: [
                user_module_1.UserModule,
                token_module_1.TokenModule,
                authorization_module_1.AuthorizationModule,
                user_module_1.UserModule,
            ],
            providers: [security_service_1.SecurityService],
            controllers: [security_controller_1.SecurityController]
        })
    ], SecurityModule);
    return SecurityModule;
}());
exports.SecurityModule = SecurityModule;
