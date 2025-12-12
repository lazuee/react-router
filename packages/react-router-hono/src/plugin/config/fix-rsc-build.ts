import { join } from "node:path";
import {
  ModuleKind,
  ModuleResolutionKind,
  Project,
  SyntaxKind,
} from "ts-morph";
import { findFileWithExtensions } from "../../lib/file";
import type { StringLiteral } from "ts-morph";

export async function fixRSCBuild(buildDir: string): Promise<void> {
  const serverDir = join(buildDir, "server");
  const ssrBuildHonoPath = findFileWithExtensions({
    cwd: serverDir,
    extensions: ["js", "mjs"],
    filename: "hono",
  });
  const serverIndexPath = join(serverDir, "index.js");

  if (!ssrBuildHonoPath) {
    throw new Error(
      `Could not find hono.js in ${join(serverDir, "__ssr_build", "assets")}`,
    );
  }

  const project = new Project({
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      module: ModuleKind.NodeNext,
      moduleResolution: ModuleResolutionKind.NodeNext,
    },
    skipAddingFilesFromTsConfig: true,
  });

  project.addSourceFilesAtPaths(join(serverDir, "**", "*.js"));

  const honoFile = project.getSourceFile(ssrBuildHonoPath);
  const indexFile = project.getSourceFile(serverIndexPath);

  if (!honoFile || !indexFile) {
    return;
  }

  await indexFile.moveImmediately(join(serverDir, "server-build.js"), {
    overwrite: true,
  });
  await honoFile.moveImmediately(join(serverDir, "index.js"), {
    overwrite: true,
  });

  for (const sourceFile of project.getSourceFiles()) {
    for (const importDec of sourceFile.getImportDeclarations()) {
      const specifier = importDec.getModuleSpecifierValue();
      if (specifier.startsWith(".") && !specifier.endsWith(".js")) {
        importDec.setModuleSpecifier(`${specifier}.js`);
      }
    }

    const callExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.CallExpression,
    );
    for (const callExpr of callExpressions) {
      if (callExpr.getExpression().getKind() === SyntaxKind.ImportKeyword) {
        const args = callExpr.getArguments();
        if (args.length > 0 && args[0].getKind() === SyntaxKind.StringLiteral) {
          const stringLiteral = args[0] as StringLiteral;
          const value = stringLiteral.getLiteralValue();
          if (value.startsWith(".") && !value.endsWith(".js")) {
            stringLiteral.setLiteralValue(`${value}.js`);
          }
        }
      }
    }
  }

  await project.save();
}
