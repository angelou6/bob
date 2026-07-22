import { readdir } from "node:fs/promises";
import path, { join } from "node:path";

export const COMMAND_BASE_PATH = path.join(process.cwd(), "dist", "commands");

export async function getCommandsFiles(): Promise<string[]> {
	const entries = await readdir(COMMAND_BASE_PATH, {
		recursive: true,
		withFileTypes: true,
	});

	return entries
		.filter((e) => e.isFile() && e.name.endsWith("js"))
		.map((e) => join(e.parentPath, e.name));
}
