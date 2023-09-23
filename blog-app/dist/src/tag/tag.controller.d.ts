import { TagService } from "./tag.service";
import { TagDto } from "./dto/tag.dto";
export declare class TagController {
    private tagService;
    constructor(tagService: TagService);
    create(tagDto: TagDto): Promise<import("./tag.entity").Tag>;
    delete(tagId: number): Promise<void>;
    getTagById(tagId: number): Promise<import("./tag.entity").Tag>;
    getAllTags(): Promise<import("./tag.entity").Tag[]>;
}
