/**
 * Helper functions to work around Supabase type limitations
 */

import { supabase } from "./client";
import type { Database } from "./types";

type TableName = keyof Database["public"]["Tables"];

/**
 * Call RPC function with typed parameters (bypasses strict typing)
 */
export async function callRpc<T = any>(
	functionName: string,
	params?: Record<string, any>,
): Promise<{ data: T | null; error: any }> {
	// @ts-expect-error - Generic helper function, types vary by RPC
	return await supabase.rpc(functionName, params);
}

/**
 * Insert into table with typed data (bypasses strict typing)
 */
export async function insertInto<T = any>(
	tableName: TableName,
	data: Record<string, any> | Record<string, any>[],
): Promise<{ data: T | null; error: any }> {
	// @ts-expect-error - Generic helper function, types vary by table
	return await supabase.from(tableName).insert(data).select().single();
}

/**
 * Update table with typed data (bypasses strict typing)
 */
export async function updateTable(
	tableName: TableName,
	data: Record<string, any>,
	whereClause: { column: string; value: any },
): Promise<{ data: any; error: any }> {
	const result = await supabase
		.from(tableName)
		.update(data)
		.eq(whereClause.column, whereClause.value);
	return result as any;
}
