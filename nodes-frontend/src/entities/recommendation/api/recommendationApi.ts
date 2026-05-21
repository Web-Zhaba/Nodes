import { getAuthToken } from "@/lib/api/stability";
import type { Recommendation } from "@/types";
import type { UpdateRecommendationDto } from "../model/types";

const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

export const recommendationApi = {
  getRecommendations: async (): Promise<Recommendation[]> => {
    const token = await getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${DJANGO_API_URL}/recommendations/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch recommendations");
    return response.json();
  },

  updateRecommendation: async (id: string, data: UpdateRecommendationDto): Promise<Recommendation> => {
    const token = await getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${DJANGO_API_URL}/recommendations/${id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error("Failed to update recommendation");
    return response.json();
  },

  generateRecommendations: async (): Promise<{ status: string; message: string }> => {
    const token = await getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${DJANGO_API_URL}/recommendations/generate/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to generate recommendations");
    return response.json();
  },

  getRecommendationStatus: async (): Promise<{ limit: number; used: number; remaining: number; can_generate: boolean }> => {
    const token = await getAuthToken();
    if (!token) throw new Error("No auth token");

    const response = await fetch(`${DJANGO_API_URL}/recommendations/status/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch recommendation status");
    return response.json();
  },
};
