/**
 * PlantUML: templates, and a local renderer for the entity/class subset.
 *
 * Rendering arbitrary PlantUML needs the PlantUML engine, which is Java — there
 * is no faithful pure-browser implementation, and the usual workaround is to
 * POST the source to plantuml.com. A Prisma schema describes somebody's
 * database, so that is not an acceptable default here.
 *
 * What this module does instead: parse the `entity`/`class` syntax — the exact
 * subset the Prisma → PlantUML conversion produces — into the same shape the
 * ER layout engine already consumes, so those diagrams render locally with no
 * network at all. Anything outside that subset is reported as unsupported
 * rather than silently drawn wrong, and the UI offers opt-in remote rendering
 * for it.
 */

/** A PlantUML problem with the line it occurred on. */
export class PlantUmlError extends Error {
  constructor(message, { line, hint } = {}) {
    super(message);
    this.name = "PlantUmlError";
    this.line = line;
    this.hint = hint;
  }
}

/* -------------------------------- Templates ------------------------------- */

export const TEMPLATES = [
  {
    id: "er",
    label: "ER Diagram",
    renderable: true,
    code: `@startuml
hide circle
skinparam linetype ortho

entity "User" as User {
  * id : UUID
  --
  * email : String <<unique>>
  name : String
  createdAt : DateTime
}

entity "Post" as Post {
  * id : UUID
  --
  * title : String
  * authorId : UUID <<FK>>
  body : String
}

entity "Comment" as Comment {
  * id : UUID
  --
  * postId : UUID <<FK>>
  body : String
}

User ||--o{ Post : writes
Post ||--o{ Comment : has

@enduml`,
  },
  {
    id: "class",
    label: "Class Diagram",
    renderable: true,
    code: `@startuml

class Repository {
  * id : String
  --
  find(id) : Entity
  save(entity) : void
}

class UserRepository {
  * table : String
  --
  findByEmail(email) : User
}

class User {
  * id : String
  --
  email : String
  name : String
}

Repository ||--|| UserRepository
UserRepository ||--o{ User

@enduml`,
  },
  {
    id: "sequence",
    label: "Sequence Diagram",
    renderable: false,
    code: `@startuml

actor Client
participant "API Gateway" as Gateway
participant "Auth Service" as Auth
database "Postgres" as DB

Client -> Gateway : POST /login
Gateway -> Auth : validate(credentials)
Auth -> DB : SELECT user
DB --> Auth : user row
Auth --> Gateway : JWT
Gateway --> Client : 200 { token }

@enduml`,
  },
  {
    id: "architecture",
    label: "Architecture Diagram",
    renderable: false,
    code: `@startuml

package "Frontend" {
  [React App]
}

package "Backend" {
  [REST API]
  [Worker]
}

database "Postgres"
cloud "CDN"

[React App] --> [REST API] : HTTPS
[REST API] --> Postgres
[Worker] --> Postgres
[React App] --> CDN : assets

@enduml`,
  },
  {
    id: "component",
    label: "Component Diagram",
    renderable: false,
    code: `@startuml

component "Web Client" as Web
component "API" as Api
component "Queue" as Queue
component "Mailer" as Mailer

interface "HTTP" as Http
interface "AMQP" as Amqp

Web -( Http
Http - Api
Api -( Amqp
Amqp - Queue
Queue --> Mailer

@enduml`,
  },
  {
    id: "usecase",
    label: "Use Case Diagram",
    renderable: false,
    code: `@startuml
left to right direction

actor Visitor
actor "Registered User" as User
actor Admin

rectangle Application {
  Visitor -- (Browse content)
  Visitor -- (Sign up)
  User -- (Publish post)
  User -- (Edit profile)
  Admin -- (Moderate content)
}

@enduml`,
  },
  {
    id: "activity",
    label: "Activity Diagram",
    renderable: false,
    code: `@startuml
start

:Receive request;

if (Authenticated?) then (yes)
  :Load user;
  if (Authorised?) then (yes)
    :Process request;
    :Return 200;
  else (no)
    :Return 403;
  endif
else (no)
  :Return 401;
endif

stop
@enduml`,
  },
];

/* --------------------------------- Parser --------------------------------- */

const ENTITY = /^\s*(?:entity|class)\s+(?:"([^"]+)"|(\w+))(?:\s+as\s+(\w+))?\s*\{/i;
const RELATION =
  /^\s*"?(\w+)"?\s*(\|\||\}o|\}\||o\||\|o|\*|o)?(--|\.\.)(o\{|\|\{|\|\||o\||\{|\|)?\s*"?(\w+)"?\s*(?::\s*(.*))?$/;

/** Reads the cardinality markers on either side of a relation line. */
function cardinalityOf(left, right) {
  const many = (token) => /\{|\}/.test(token || "");
  const optional = (token) => /o/.test(token || "");

  if (many(left) && many(right)) return "many-to-many";
  if (many(left) || many(right)) return "one-to-many";
  void optional;
  return "one-to-one";
}

/**
 * Parses the entity/class subset into `{ models, enums, relations }` — the
 * same shape `layoutSchema` takes, so PlantUML and Prisma share one renderer.
 */
export function parsePlantUmlEntities(code) {
  if (!code || !code.trim()) {
    throw new PlantUmlError("There is no diagram source to render.", {
      hint: "Write some PlantUML or pick a template.",
    });
  }

  const lines = code.split(/\r?\n/);
  const models = [];
  const enums = [];
  const relations = [];
  const unsupported = new Set();

  let current = null;
  let pastSeparator = false;
  let inSkinparamBlock = false;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    const lineNumber = index + 1;

    if (!line || line.startsWith("'") || /^@(start|end)uml/i.test(line)) return;

    // `skinparam entity { … }` spans several lines; its contents are styling,
    // not diagram structure, so the whole block is skipped rather than each
    // inner line being reported as an unsupported construct.
    if (inSkinparamBlock) {
      if (line === "}") inSkinparamBlock = false;
      return;
    }
    if (/^skinparam\b/i.test(line)) {
      if (line.endsWith("{")) inSkinparamBlock = true;
      return;
    }
    if (/^(hide|show|title|header|footer|scale|left to right|top to bottom|!|@)/i.test(line)) return;

    if (current) {
      if (line === "}") {
        models.push(current);
        current = null;
        pastSeparator = false;
        return;
      }
      if (/^-{2,}$/.test(line) || /^\.{2,}$/.test(line) || /^={2,}$/.test(line)) {
        pastSeparator = true;
        return;
      }

      // `* name : Type <<marker>>`
      const fieldMatch = /^(\*\s*)?([\w"]+)\s*(?::\s*([^<]+))?\s*(<<.*>>)?$/.exec(line);
      if (!fieldMatch) return;

      const markers = (fieldMatch[4] || "").toLowerCase();
      const required = Boolean(fieldMatch[1]);

      current.fields.push({
        name: fieldMatch[2].replace(/"/g, ""),
        type: (fieldMatch[3] || "").trim() || "—",
        // Above the separator, a starred field is the key; below it, a star
        // just means "required", which is PlantUML's own convention.
        isId: required && !pastSeparator,
        isForeignKey: markers.includes("fk"),
        isUnique: markers.includes("unique") || markers.includes("uq"),
        isOptional: !required && pastSeparator,
        isArray: /\[\]$/.test((fieldMatch[3] || "").trim()),
        line: lineNumber,
      });
      return;
    }

    const entityMatch = ENTITY.exec(line);
    if (entityMatch) {
      const label = entityMatch[1] || entityMatch[2];
      current = { name: entityMatch[3] || label, label, fields: [], line: lineNumber };
      pastSeparator = false;
      return;
    }

    const relationMatch = RELATION.exec(line);
    if (relationMatch && relationMatch[3]) {
      const [, from, left, , right, to, label] = relationMatch;
      relations.push({
        kind: cardinalityOf(left, right),
        fromModel: from,
        toModel: to,
        label: label?.trim() || null,
        fromField: null,
        toField: null,
        ownerModel: to,
      });
      return;
    }

    // Anything left is a construct this local renderer does not draw.
    const keyword = /^(\w+)/.exec(line)?.[1];
    if (keyword) unsupported.add(keyword.toLowerCase());
  });

  if (current) {
    throw new PlantUmlError(`The entity "${current.name}" is missing its closing brace.`, {
      line: current.line,
      hint: "Every entity or class block must be closed with }.",
    });
  }

  if (models.length === 0) {
    throw new PlantUmlError("No entity or class blocks were found.", {
      hint: "This preview renders entity and class diagrams. Sequence, activity and component diagrams need the PlantUML engine — use the remote renderer for those.",
    });
  }

  // Relations pointing at something that was never declared would draw into
  // empty space, so they are reported instead.
  const names = new Set(models.map((model) => model.name));
  const resolved = relations.filter(
    (relation) => names.has(relation.fromModel) && names.has(relation.toModel),
  );

  return {
    models,
    enums,
    relations: resolved,
    unsupported: [...unsupported],
    skippedRelations: relations.length - resolved.length,
  };
}

/* ------------------------- Remote rendering (opt-in) ----------------------- */

const PLANTUML_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";

/** PlantUML's own base64 variant, applied to raw-deflated bytes. */
function encode64(bytes) {
  let output = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const b1 = bytes[index];
    const b2 = bytes[index + 1];
    const b3 = bytes[index + 2];

    output += PLANTUML_ALPHABET[b1 >> 2];
    output += PLANTUML_ALPHABET[((b1 & 0x3) << 4) | ((b2 ?? 0) >> 4)];
    if (b2 === undefined) break;
    output += PLANTUML_ALPHABET[((b2 & 0xf) << 2) | ((b3 ?? 0) >> 6)];
    if (b3 === undefined) break;
    output += PLANTUML_ALPHABET[b3 & 0x3f];
  }
  return output;
}

/**
 * Builds the URL a PlantUML server would render.
 *
 * Deflates with `CompressionStream`, which every current browser has, so no
 * compression library is needed. Callers must treat the result as *sending the
 * diagram source to a third party* — the UI makes that explicit and keeps it
 * off by default.
 */
export async function plantUmlServerUrl(code, { server = "https://www.plantuml.com/plantuml", format = "svg" } = {}) {
  if (typeof CompressionStream === "undefined") {
    throw new PlantUmlError("This browser cannot compress the diagram source for the server renderer.");
  }
  const stream = new Blob([new TextEncoder().encode(code)])
    .stream()
    .pipeThrough(new CompressionStream("deflate-raw"));
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
  return `${server}/${format}/~1${encode64(compressed)}`;
}
