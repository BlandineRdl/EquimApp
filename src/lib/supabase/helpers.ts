/**
 * Helper functions to work around Supabase type limitations
 */

import { supabase } from "./client";
import type { Database } from "../../types/database.types";
import type { PostgrestError } from "@supabase/supabase-js";

type TableName = keyof Database["public"]["Tables"];

/**
 * Call RPC function with typed parameters
 */
export async function callRpc<T>(
	functionName: string,
	params?: Record<string, unknown>,
): Promise<{ data: T | null; error: PostgrestError | null }> {
	// @ts-expect-error - Generic helper function, types vary by RPC
	return await supabase.rpc(functionName, params);
}

/**
 * Insert into table with typed data
 */
export async function insertInto<T>(
	tableName: TableName,
	data: Record<string, unknown> | Record<string, unknown>[],
): Promise<{ data: T | null; error: PostgrestError | null }> {
	// @ts-expect-error - Generic helper function, types vary by table
	return await supabase.from(tableName).insert(data).select().single();
}

/**
 * Update table with typed data
 */
export async function updateTable<T = unknown>(
	tableName: TableName,
	data: Record<string, unknown>,
	whereClause: { column: string; value: unknown },
): Promise<{ data: T | null; error: PostgrestError | null }> {
	const result = await supabase
		.from(tableName)
		.update(data)
		.eq(whereClause.column, whereClause.value)
		.select()
		.single();
	return result as { data: T | null; error: PostgrestError | null };
}
