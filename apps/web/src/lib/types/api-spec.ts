export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type AuthType = "none" | "bearer" | "api-key" | "session";

export interface ApiParam {
  name: string;
  type: string;
  description: string;
}

export interface ApiQueryParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema: object | null;
}

export interface ApiEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  summary: string;
  description: string;
  tags: string[];
  auth: AuthType;
  pathParams: ApiParam[];
  queryParams: ApiQueryParam[];
  requestBody: { contentType: string; schema: object } | null;
  responses: ApiResponse[];
}

export interface ApiSchemaModel {
  name: string;
  fields: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
}

export interface ApiSpec {
  title: string;
  version: string;
  baseUrl: string;
  summary: string;
  endpoints: ApiEndpoint[];
  schemas: ApiSchemaModel[];
  authentication: {
    type: string;
    description: string;
  };
  considerations: {
    security: string[];
    versioning: string[];
    performance: string[];
  };
}
