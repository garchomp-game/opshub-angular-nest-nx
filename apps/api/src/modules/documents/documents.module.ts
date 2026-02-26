import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageService } from './storage/storage.service';
import { LocalStorageService } from './storage/local-storage.service';

@Module({
    controllers: [DocumentsController],
    providers: [
        DocumentsService,
        {
            provide: StorageService,
            useClass: LocalStorageService,
        },
    ],
    exports: [DocumentsService],
})
export class DocumentsModule { }
