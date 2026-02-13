import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly uploadPath = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
     if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file provided');
    }
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadPath, fileName);
    
    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Return relative path for database storage
    const relativePath = `uploads/${fileName}`;
    return {
      success: true,
      filePath: relativePath,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    };
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadPath, fileName);
    
    // Write file to disk
    await fs.promises.writeFile(filePath, file.buffer);
    
    // Return relative path for database storage
    return `uploads/${fileName}`;
  }
  
 async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }
}
