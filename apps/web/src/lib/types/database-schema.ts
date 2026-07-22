export interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue: string | null;
  description: string;
}

export interface SchemaTable {
  id: string;
  name: string;
  description: string;
  columns: SchemaColumn[];
}

export type RelationType = "one-to-one" | "one-to-many" | "many-to-many";

export interface SchemaRelation {
  from: string;
  to: string;
  fromColumn: string;
  toColumn: string;
  type: RelationType;
}

export interface SchemaIndex {
  table: string;
  columns: string[];
  type: "btree" | "gin" | "unique";
}

export interface SchemaConsiderations {
  normalization: string[];
  indexing: string[];
  scaling: string[];
}

export interface DatabaseSchema {
  summary: string;
  tables: SchemaTable[];
  relations: SchemaRelation[];
  indexes: SchemaIndex[];
  considerations: SchemaConsiderations;
  sql: string;
}
