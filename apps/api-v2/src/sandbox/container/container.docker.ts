import { docker } from "..";
import type Dockerode from "dockerode";
import { getAgent } from "../../libs/db";
import path from "node:path";
import tar from "tar-stream";
import { exitCode } from "node:process";
import { ContainerError, getContainerOrThrow } from "./container.helpers";

export const createContainer = async (
  sandboxId: string,
  name: string,
): Promise<Dockerode.Container> => {
  const container = await docker.createContainer({
    name,
    Image: `node:22-alpine`,
    Labels: {
      sandbox_id: sandboxId,
    },
    WorkingDir: "/workspace/",
    Cmd: ["sleep", "infinity"],
    Tty: true,
    HostConfig: {
      NetworkMode: sandboxId,
      Memory: 512 * 1024 * 1024, // 512MB,
      NanoCpus: 1 * 1e9, // 1 CPU
    },
  });

  console.log("Container created", container.id);

  return container;
};

export const execInContainer = async (
  id: string,
  cmd: string[],
  onChunk?: (text: string) => void,
) => {
  const container = await getContainerOrThrow(id);

  const exec = await container.exec({
    Tty: true,
    AttachStdout: true,
    AttachStderr: true,
    Cmd: cmd,
  });

  const stream = await exec.start({ Tty: true });

  let output = "";
  for await (const chunk of stream) {
    output += chunk.toString("utf-8");
    onChunk?.(output);
  }

  const { ExitCode } = await exec.inspect();
  if (ExitCode !== 0) {
    throw new ContainerError(
      output.trim() || `Command failed: ${cmd.join(" ")}`,
      ExitCode,
    );
  }

  return { output };
};

export const writeContainerFile = async (
  id: string,
  content: string,
  filePath: string,
) => {
  const full = path.posix.resolve("/workspace", filePath);
  if (!full.startsWith("/workspace/")) {
    throw new ContainerError("Path must be inside /workspace/");
  }

  const container = await getContainerOrThrow(id);
  const dir = path.posix.dirname(full);

  await execInContainer(id, ["mkdir", "-p", dir]);

  const pack = tar.pack();
  pack.entry({ name: path.posix.basename(full), mode: 0o644 }, content);
  pack.finalize();

  const chunks: Buffer[] = [];
  for await (const chunk of pack) chunks.push(chunk as Buffer);

  await container.putArchive(Buffer.concat(chunks), { path: dir });
  return { path: full };
};

const MAX_READ_BYTES = 100_000;

export const readContainerFile = async (id: string, filePath: string) => {
  const full = path.posix.resolve("/workspace", filePath);
  if (!full.startsWith("/workspace/")) {
    throw new ContainerError("Path must be inside /workspace/");
  }

  const container = await getContainerOrThrow(id);

  let archive: NodeJS.ReadableStream;
  try {
    archive = await container.getArchive({ path: full });
  } catch (err) {
    throw new ContainerError(`File not found: ${full}`);
  }

  const extract = tar.extract();
  archive.pipe(extract);

  for await (const entry of extract) {
    const header = entry.header;

    if (header.type !== "file") {
      entry.resume();
      throw new ContainerError(`${full} is not a regular file`);
    }

    const chunks: Buffer[] = [];
    let received = 0;
    for await (const chunk of entry) {
      if (received < MAX_READ_BYTES) chunks.push(chunk as Buffer);
      received += (chunk as Buffer).length;
    }

    const text = Buffer.concat(chunks)
      .subarray(0, MAX_READ_BYTES)
      .toString("utf-8");
    return received > MAX_READ_BYTES
      ? `${text}\n...[truncated, file is ${received} bytes]`
      : text;
  }

  throw new ContainerError(`Could not read ${full}`);
};
