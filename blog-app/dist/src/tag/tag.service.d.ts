import { TagDto } from "./dto/tag.dto";
import { Tag } from "./tag.entity";
import { Repository } from "typeorm";
export declare class TagService {
    private tagRepository;
    constructor(tagRepository: Repository<Tag>);
    createTag(tagDto: TagDto): Promise<Tag>;
    deleteTag(tagId: number): Promise<void>;
    findById(tagId: number): Promise<Tag>;
    getAll(): Promise<Tag[]>;
}
