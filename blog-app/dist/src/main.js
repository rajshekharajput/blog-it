"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageRef = exports.admin = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const cookieParser = require("cookie-parser");
const firebaseAdmin = require("firebase-admin");
const serviceAccount = require("../blog-app-ff2df-firebase-adminsdk-t2e0z-5e8254bf77.json");
exports.admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
});
exports.storageRef = exports.admin.storage().bucket('gs://blog_app');
async function bootstrap() {
    const PORT = process.env.PORT || 5000;
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use(cookieParser());
    app.enableCors({ credentials: true, origin: process.env.CLIENT_URL });
    await app.listen(PORT, () => console.log(`Server running om port: ${PORT}`));
}
bootstrap();
//# sourceMappingURL=main.js.map