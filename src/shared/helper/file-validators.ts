import path, { extname } from "path";
import * as fs from "fs";
import { ConflictException } from "@nestjs/common";

export const editFileName = (file) => {
    let name = file.originalname.split(".")[0];
    name = name.split(" ").join("");
    const fileExtName = extname(file.originalname);
    const fileNameDate = Date.now();
    return `${fileNameDate}_${name}${fileExtName}`;
};

export const pathExistence = async (fullPath: string) => {
    const directory = path.dirname(fullPath);
    try {
        await fs.promises.mkdir(directory, { recursive: true });
    } catch (err) {
        throw new Error("ERR_DIR_CREATE");
    }
};

export const imageValidation = (file) => {
    const [uploadFile] = file;
    if (uploadFile?.size > 20 * 1024 * 1024) {
        throw new ConflictException("ERR_PLATE_IMAGE_OUT_OF_SIZE&&&attachments")
    }
    if (uploadFile?.mimetype && !['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/svg+xml'].includes(uploadFile?.mimetype)) {
        throw new ConflictException("ERR_PLATE_IMAGE_TYPE&&&attachments")
    }
}