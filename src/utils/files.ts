import * as path from "@std/path";

export const COMMAND_BASE_PATH = path.join(Deno.cwd(), "src", "commands");

export async function getCommandsFiles(): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    for await (const entry of Deno.readDir(dir)) {
      const fullPath = `${dir}/${entry.name}`;
      if (entry.isDirectory) {
        await walk(fullPath);
      } else if (entry.isFile && entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  await walk(COMMAND_BASE_PATH);
  return files;
}
