import path from "path";

import dotenv from "dotenv";
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { z } from "zod";

const ApiErrorResponseSchema = z.object({
  detail: z.string(),
});
const envPath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envPath });

const DEFAULT_BASELINK = "http://localhost:5000";

export class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL?: string) {
    const BaseURL = baseURL || process.env.BASE_URL || DEFAULT_BASELINK;

    this.axiosInstance = axios.create({
      baseURL: BaseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.axiosInstance.interceptors.response.use(
      this.handleSuccess,
      this.handleError,
    );
  }

  private handleSuccess = (response: AxiosResponse) => {
    return response;
  };

  private handleError = (error: AxiosError) => {
    if (error.response) {
      const errorData = error.response.data;

      const parsedError = ApiErrorResponseSchema.safeParse(errorData);

      if (parsedError.success) {
        return Promise.reject(new Error(parsedError.data.detail));
      } else {
        return Promise.reject(new Error("An unexpected error occurred."));
      }
    } else if (error.request) {
      return Promise.reject(new Error("No response received from the server."));
    } else {
      return Promise.reject(new Error(error.message));
    }
  };

  public get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance
      .get(url, config)
      .then((response) => response.data);
  }

  public post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.axiosInstance
      .post(url, data, config)
      .then((response) => response.data);
  }

  public put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.axiosInstance
      .put(url, data, config)
      .then((response) => response.data);
  }

  public delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.axiosInstance
      .delete(url, config)
      .then((response) => response.data);
  }
  public async downloadFile(
    url: string,
    fileName: string,
    config?: AxiosRequestConfig,
  ): Promise<{ data: Blob; filename: string }> {
    const response = await this.axiosInstance.get(url, {
      ...config,
      responseType: "blob",
    });

    const contentDisposition = response.headers["content-disposition"];
    const filenameMatch = contentDisposition?.match(/filename\*?=UTF-8''(.+)/);
    const filename = filenameMatch
      ? decodeURIComponent(filenameMatch[1])
      : fileName;

    return {
      data: response.data,
      filename,
    };
  }
}
const apiClient = new ApiClient();

export default apiClient;
