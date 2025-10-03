/**
 * Column definition types for schema validation
 */

/**
 * Supported column data types
 */
export type ColumnType = "string" | "number" | "boolean" | "date" | "enum";

/**
 * Data type enum for backward compatibility
 */
export enum DataType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  DATE = "date",
  ENUM = "enum"
}

/**
 * Column definition for schema validation
 */
export interface ColumnDef {
  /** Unique identifier for the column */
  id: string;
  /** Column name (alias for id) */
  name?: string;
  /** Data type of the column */
  type: ColumnType | DataType;
  /** Valid values for enum columns */
  enumValues?: string[];
  /** Optional display name */
  displayName?: string;
}