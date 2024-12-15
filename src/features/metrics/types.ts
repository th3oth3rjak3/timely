import { Tag } from "../tags/types/Tag";

export interface FilterFormInputs {
  startDate?: Date;
  endDate?: Date;
  tags?: string[];
}

export interface MetricsFilterCriteria {
  startDate: Date;
  endDate: Date;
  tags: Tag[];
}
