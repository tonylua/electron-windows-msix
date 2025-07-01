import { log } from "./logger";
import { ProgramOptions } from "./types";
import iconv from "iconv-lite";

const run = async (executable: string, args: Array<string>) => {
  // console.log("run args", args);
  return new Promise<string>((resolve, reject) => {
    const proc = require("child_process").spawn(executable, args, {});
    log.debug(`Calling ${executable} with args`, args);

    let stdoutChunks: Buffer[] = [];
    proc.stdout.on("data", (data) => {
      stdoutChunks.push(data);
    });

    let stderrChunks: Buffer[] = [];
    proc.stderr.on("data", (data) => {
      stderrChunks.push(data);
    });

    proc.on("exit", (code) => {
      const stdoutBuffer = Buffer.concat(stdoutChunks);
      const stderrBuffer = Buffer.concat(stderrChunks);

      const stdout = iconv.decode(stdoutBuffer, "gbk");
      const stderr = iconv.decode(stderrBuffer, "gbk");

      log.debug(`stdout of ${executable}`, stdout.split("\n"));

      if (code !== 0) {
        log.error(`stderr of ${executable}`, false, stderr.split("\n"));
        return reject(
          new Error(
            `Failed running ${executable} Exit Code: ${code} See previous errors for details`,
          ),
        );
      }

      return resolve(stdout);
    });

    proc.stdin.end();
  });
};

export const getCertPublisher = async (cert: string, cert_pass: string) => {
  const args = [];
  if (cert_pass) {
    args.push("-p", cert_pass);
  }
  args.push("-dump", cert);
  const certDump = await run("certutil", args);
  // console.log(111, certDump);
  const subjectRegex = /(?:Subject|颁发者):\s*(.*)/;
  const match = certDump.match(subjectRegex);
  const publisher = match ? match[1].trim() : null;
  if (!publisher) {
    log.error("Unable to find publisher in Cert");
  }
  return publisher;
};

export const priConfig = async (program: ProgramOptions) => {
  const { makePri, priConfig, createPri } = program;
  if (createPri) {
    const args = ["createconfig", "/cf", priConfig, "/dq", "en-US"];
    log.debug("Creating pri config.");
    await run(makePri, args);
  } else {
    log.debug("Skipping making pri config.");
  }
};

export const pri = async (program: ProgramOptions) => {
  const {
    makePri,
    priConfig,
    layoutDir,
    priFile,
    appManifestLayout,
    createPri,
  } = program;
  if (createPri) {
    log.debug("Making pri.");
    const args = [
      "new",
      "/pr",
      layoutDir,
      "/cf",
      priConfig,
      "/mn",
      appManifestLayout,
      "/of",
      priFile,
      "/v",
    ];
    await run(makePri, args);
  } else {
    log.debug("Skipping making pri.");
  }
};

export const make = async (program: ProgramOptions) => {
  const { makeMsix, layoutDir, msix, isSparsePackage } = program;
  const args = ["pack", "/d", layoutDir, "/p", msix, "/o"];

  if (isSparsePackage) {
    args.push("/nv");
  }

  await run(makeMsix, args);
};

export const sign = async (program: ProgramOptions) => {
  const { signTool, signParams, msix } = program;
  if (signParams[0] === "sign") signParams.shift();
  const args = ["sign", ...signParams, msix];
  await run(signTool, args);
};
