/**
 * CMS content model, described once and consumed everywhere.
 *
 * The admin UI builds its forms and tables straight from these definitions, so
 * adding a field here is the only change needed to expose it for editing. Each
 * resource mirrors a backend resource registered in `services/cms.js`.
 */

/** Supported editor controls. */
export const FIELD = {
  TEXT: "text",
  TEXTAREA: "textarea",
  NUMBER: "number",
  BOOLEAN: "boolean",
  SELECT: "select",
  IMAGE: "image",
  COLOR: "color",
  LINK: "link",
  LIST: "list",
  JSON: "json",
};

const orderField = {
  name: "order",
  label: "Order",
  type: FIELD.NUMBER,
  help: "Lower numbers appear first.",
};
const enabledField = {
  name: "enabled",
  label: "Enabled",
  type: FIELD.BOOLEAN,
  default: true,
};

export const RESOURCES = {
  hero: {
    key: "hero",
    label: "Hero",
    group: "Content",
    singleton: true,
    description: "The full-screen opening statement.",
    fields: [
      { name: "eyebrow", label: "Eyebrow", type: FIELD.TEXT },
      {
        name: "title",
        label: "Headline",
        type: FIELD.TEXTAREA,
        rows: 3,
        help: "One line per row — each row animates in separately.",
      },
      { name: "description", label: "Supporting statement", type: FIELD.TEXTAREA, rows: 3 },
      { name: "primaryCTA", label: "Primary CTA", type: FIELD.LINK },
      { name: "secondaryCTA", label: "Secondary CTA", type: FIELD.LINK },
      { name: "heroImage", label: "Hero image", type: FIELD.IMAGE },
      { name: "enabled", label: "Enabled", type: FIELD.BOOLEAN, default: true },
    ],
  },

  navigation: {
    key: "navigation",
    label: "Navigation",
    group: "Content",
    singleton: false,
    description: "Links in the floating navigation bar.",
    columns: ["label", "url", "order", "visible"],
    titleField: "label",
    fields: [
      { name: "label", label: "Label", type: FIELD.TEXT, required: true },
      { name: "url", label: "URL", type: FIELD.TEXT, required: true },
      orderField,
      { name: "visible", label: "Visible", type: FIELD.BOOLEAN, default: true },
    ],
  },

  sections: {
    key: "sections",
    label: "Sections",
    group: "Content",
    singleton: false,
    description: "Ordered page sections between the hero and the footer.",
    columns: ["type", "title", "order", "enabled"],
    titleField: "title",
    fields: [
      {
        name: "type",
        label: "Type",
        type: FIELD.SELECT,
        required: true,
        options: [
          "marquee",
          "statement",
          "about",
          "features",
          "collections",
          "technology",
          "proof",
          "cta",
        ],
        help: "Determines which layout renders this section.",
      },
      { name: "title", label: "Title", type: FIELD.TEXTAREA, rows: 2 },
      { name: "subtitle", label: "Subtitle", type: FIELD.TEXT },
      { name: "description", label: "Description", type: FIELD.TEXTAREA, rows: 4 },
      {
        name: "content",
        label: "Content",
        type: FIELD.JSON,
        help: "Structured payload for this section type (items, lines, stats…).",
      },
      { name: "image", label: "Image", type: FIELD.IMAGE },
      orderField,
      enabledField,
    ],
  },

  features: {
    key: "features",
    label: "Features",
    group: "Content",
    singleton: false,
    description: "The numbered capability cards.",
    columns: ["title", "icon", "order", "enabled"],
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: FIELD.TEXT, required: true },
      { name: "description", label: "Description", type: FIELD.TEXTAREA, rows: 3 },
      {
        name: "icon",
        label: "Icon",
        type: FIELD.SELECT,
        options: ["shield", "layers", "spark", "grid", "lock", "pen", "search"],
      },
      { name: "image", label: "Image", type: FIELD.IMAGE },
      orderField,
      enabledField,
    ],
  },

  collections: {
    key: "collections",
    label: "Collections",
    group: "Content",
    singleton: false,
    description: "Products and collections shown in the editorial grid.",
    columns: ["title", "category", "status", "featured", "order"],
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: FIELD.TEXT, required: true },
      {
        name: "slug",
        label: "Slug",
        type: FIELD.TEXT,
        required: true,
        help: "Unique, lowercase, URL-safe.",
      },
      { name: "description", label: "Description", type: FIELD.TEXTAREA, rows: 3 },
      { name: "image", label: "Image", type: FIELD.IMAGE },
      { name: "category", label: "Category", type: FIELD.TEXT },
      {
        name: "status",
        label: "Status",
        type: FIELD.SELECT,
        options: ["draft", "published", "archived"],
        default: "draft",
        help: "Only published items appear on the landing page.",
      },
      { name: "featured", label: "Featured", type: FIELD.BOOLEAN },
      orderField,
      enabledField,
    ],
  },

  testimonials: {
    key: "testimonials",
    label: "Testimonials",
    group: "Content",
    singleton: false,
    description: "Social proof quotes.",
    columns: ["name", "company", "order", "enabled"],
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: FIELD.TEXT, required: true },
      { name: "role", label: "Role", type: FIELD.TEXT },
      { name: "company", label: "Company", type: FIELD.TEXT },
      { name: "avatar", label: "Avatar", type: FIELD.IMAGE },
      { name: "quote", label: "Quote", type: FIELD.TEXTAREA, rows: 3 },
      orderField,
      enabledField,
    ],
  },

  media: {
    key: "media",
    label: "Media",
    group: "Media",
    singleton: false,
    description: "Images and videos available to other content types.",
    columns: ["title", "type", "url"],
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: FIELD.TEXT },
      { name: "url", label: "URL", type: FIELD.TEXT, required: true },
      {
        name: "type",
        label: "Type",
        type: FIELD.SELECT,
        options: ["image", "video"],
        default: "image",
      },
      { name: "alt", label: "Alt text", type: FIELD.TEXT, help: "Describe the asset for screen readers." },
    ],
  },

  "site-settings": {
    key: "site-settings",
    label: "Site Settings",
    group: "Settings",
    singleton: true,
    description: "Identity, brand colours, and contact details.",
    fields: [
      { name: "siteName", label: "Site name", type: FIELD.TEXT },
      { name: "logo", label: "Logo", type: FIELD.IMAGE },
      { name: "favicon", label: "Favicon", type: FIELD.IMAGE },
      { name: "primaryColor", label: "Primary colour", type: FIELD.COLOR },
      { name: "secondaryColor", label: "Secondary colour", type: FIELD.COLOR },
      {
        name: "socialLinks",
        label: "Social links",
        type: FIELD.LIST,
        itemFields: ["platform", "url", "icon"],
      },
      {
        name: "contactInformation",
        label: "Contact",
        type: FIELD.JSON,
        help: "email, phone, address",
      },
    ],
  },

  seo: {
    key: "seo",
    label: "SEO",
    group: "Settings",
    singleton: true,
    description: "Metadata, Open Graph, and indexing rules.",
    fields: [
      { name: "metaTitle", label: "Meta title", type: FIELD.TEXT },
      { name: "metaDescription", label: "Meta description", type: FIELD.TEXTAREA, rows: 3 },
      {
        name: "keywords",
        label: "Keywords",
        type: FIELD.LIST,
        help: "One keyword per row.",
      },
      { name: "ogTitle", label: "OG title", type: FIELD.TEXT },
      { name: "ogDescription", label: "OG description", type: FIELD.TEXTAREA, rows: 3 },
      { name: "ogImage", label: "OG image", type: FIELD.IMAGE },
      { name: "canonicalUrl", label: "Canonical URL", type: FIELD.TEXT },
      {
        name: "robots",
        label: "Robots",
        type: FIELD.SELECT,
        options: ["index, follow", "noindex, follow", "index, nofollow", "noindex, nofollow"],
      },
    ],
  },

  footer: {
    key: "footer",
    label: "Footer",
    group: "Settings",
    singleton: true,
    description: "Closing block: blurb, link columns, and copyright.",
    fields: [
      { name: "description", label: "Description", type: FIELD.TEXTAREA, rows: 3 },
      {
        name: "links",
        label: "Links",
        type: FIELD.LIST,
        itemFields: ["label", "url"],
      },
      {
        name: "socialLinks",
        label: "Social links",
        type: FIELD.LIST,
        itemFields: ["platform", "url", "icon"],
      },
      { name: "copyright", label: "Copyright", type: FIELD.TEXT },
    ],
  },
};

/** Admin sidebar structure, derived from the model so the two cannot drift. */
export const ADMIN_GROUPS = ["Content", "Media", "Settings"].map((group) => ({
  group,
  items: Object.values(RESOURCES).filter((resource) => resource.group === group),
}));

export const getResourceModel = (key) => RESOURCES[key] || null;

/** Builds an empty record for a resource, honouring per-field defaults. */
export const emptyRecord = (resource) =>
  resource.fields.reduce((record, field) => {
    if (field.default !== undefined) record[field.name] = field.default;
    else if (field.type === FIELD.BOOLEAN) record[field.name] = false;
    else if (field.type === FIELD.NUMBER) record[field.name] = 0;
    else if (field.type === FIELD.LIST) record[field.name] = [];
    else if (field.type === FIELD.LINK) record[field.name] = { label: "", url: "" };
    else if (field.type === FIELD.JSON) record[field.name] = null;
    else record[field.name] = "";
    return record;
  }, {});
