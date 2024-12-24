import { MetricsBucket, Tag } from "../../models/ZodModels";

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

export interface MetricsSearchCriteria {
  tags: Tag[];
  buckets: MetricsBucket[];
}
