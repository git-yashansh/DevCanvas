export type ServiceType =
  | "api"
  | "worker"
  | "gateway"
  | "database"
  | "cache"
  | "queue"
  | "storage"
  | "client"
  | "external";

export interface ArchitectureService {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  technology: string;
  scaling: string;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  label: string;
  type: "sync" | "async";
}

export interface DataFlow {
  id: string;
  name: string;
  steps: string[];
}

export interface CostBreakdownItem {
  service: string;
  cost: number;
}

export interface ArchitectureConsiderations {
  scaling: string[];
  security: string[];
  reliability: string[];
}

export interface Architecture {
  summary: string;
  services: ArchitectureService[];
  connections: ArchitectureConnection[];
  dataFlows: DataFlow[];
  considerations: ArchitectureConsiderations;
  estimatedCost: {
    monthly: number;
    breakdown: CostBreakdownItem[];
  };
}
