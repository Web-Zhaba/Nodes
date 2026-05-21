import type { Recommendation } from "@/types";

export type UpdateRecommendationDto = Partial<Pick<Recommendation, "is_saved" | "is_discarded" | "is_viewed">>;

export interface RecommendationListResponse {
  results: Recommendation[];
  count: number;
  next?: string;
  previous?: string;
}
