import axios from "axios";
import { API_BASE_URL } from "./constants";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "User-Agent": "arcadia-elizaos/0.1.0" },
});

export async function apiGet<T = unknown>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T> {
  const resp = await client.get<T>(path, { params });
  return resp.data;
}

export async function apiPost<T = unknown>(
  path: string,
  body: unknown,
): Promise<T> {
  const resp = await client.post<T>(path, body);
  return resp.data;
}
