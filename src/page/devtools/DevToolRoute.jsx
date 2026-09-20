import { lazy, Suspense } from "react";
import { Navigate, useParams } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { findTool } from "../../devtools/registry";
import { getIoTool } from "../../devtools/ioTools";
import IoToolPage from "./IoToolPage";

/**
 * One route for every developer tool: `/devtools/:toolId`.
 *
 * Mirrors how the Content Studio already works — `/content/:action` looks its
 * screen up in the `PAGES` config — so adding a tool stays a registry entry
 * plus (when it needs one) a component, never a new route.
 *
 * Bespoke tools are lazily imported, so opening the JSON formatter does not
 * download the API client or the ER diagram renderer.
 */
const COMPONENTS = {
  ApiClient: lazy(() => import("./tools/ApiClient")),
  BorderRadiusGenerator: lazy(() => import("./tools/BorderRadiusGenerator")),
  BoxShadowGenerator: lazy(() => import("./tools/BoxShadowGenerator")),
  ChmodCalculator: lazy(() => import("./tools/ChmodCalculator")),
  ClampGenerator: lazy(() => import("./tools/ClampGenerator")),
  ColorConverter: lazy(() => import("./tools/ColorConverter")),
  CronTester: lazy(() => import("./tools/CronTester")),
  DiffChecker: lazy(() => import("./tools/DiffChecker")),
  EnvValidator: lazy(() => import("./tools/EnvValidator")),
  ErdGenerator: lazy(() => import("./tools/ErdGenerator")),
  GitCommands: lazy(() => import("./tools/GitCommands")),
  GradientGenerator: lazy(() => import("./tools/GradientGenerator")),
  HashGenerator: lazy(() => import("./tools/HashGenerator")),
  HeadersInspector: lazy(() => import("./tools/HeadersInspector")),
  HttpStatusLookup: lazy(() => import("./tools/HttpStatusLookup")),
  JsonDiff: lazy(() => import("./tools/JsonDiff")),
  JsonPathTester: lazy(() => import("./tools/JsonPathTester")),
  JsonSchemaValidator: lazy(() => import("./tools/JsonSchemaValidator")),
  JwtInspector: lazy(() => import("./tools/JwtInspector")),
  LoremGenerator: lazy(() => import("./tools/LoremGenerator")),
  MarkdownPreview: lazy(() => import("./tools/MarkdownPreview")),
  MimeLookup: lazy(() => import("./tools/MimeLookup")),
  PasswordGenerator: lazy(() => import("./tools/PasswordGenerator")),
  PrismaViewer: lazy(() => import("./tools/PrismaViewer")),
  PrismaWorkspace: lazy(() => import("./tools/PrismaWorkspace")),
  QueryStringParser: lazy(() => import("./tools/QueryStringParser")),
  RandomDataGenerator: lazy(() => import("./tools/RandomDataGenerator")),
  RegexTester: lazy(() => import("./tools/RegexTester")),
  SqlValidator: lazy(() => import("./tools/SqlValidator")),
  TextCounter: lazy(() => import("./tools/TextCounter")),
  TimestampConverter: lazy(() => import("./tools/TimestampConverter")),
  TimezoneConverter: lazy(() => import("./tools/TimezoneConverter")),
  UrlParser: lazy(() => import("./tools/UrlParser")),
  UserAgentParser: lazy(() => import("./tools/UserAgentParser")),
  UuidGenerator: lazy(() => import("./tools/UuidGenerator")),
};

export default function DevToolRoute() {
  const { toolId } = useParams();
  const tool = findTool(toolId);

  // An unknown id is a stale bookmark or a typo — send them to the hub rather
  // than rendering an empty shell.
  if (!tool) return <Navigate to="/devtools" replace />;

  if (getIoTool(toolId)) return <IoToolPage toolId={toolId} />;

  const Component = COMPONENTS[tool.component];
  if (!Component) return <Navigate to="/devtools" replace />;

  return (
    <Suspense fallback={<LoadingSpinner label={`Loading ${tool.title}`} />}>
      <Component toolId={toolId} />
    </Suspense>
  );
}
