import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class ParseIsSummaryPipe implements PipeTransform {
   transform(value: any, metadata: ArgumentMetadata) {
      if (metadata.type === 'query' && metadata.data === 'isSummary') {
         return value === 'true';
      }
      return value;
   }
}
